"""
Weather Data Aggregator
Combines data from multiple sources (Open-Meteo, NOAA) into unified format
"""
from typing import List, Optional, Dict, Tuple
from datetime import datetime, timedelta, date
from loguru import logger
import asyncio

from models.weather import (
    WeatherPoint,
    WeatherRequest,
    WeatherResponse,
    CurrentData,
    Coordinates
)
from services.weather.open_meteo import get_open_meteo_service
from services.weather.mock_open_meteo import get_mock_open_meteo_service
from services.weather.ocean_currents import get_ocean_currents_service
from services.weather.smart_cache import SmartWeatherCache
from config import settings


class WeatherCache:
    """Simple in-memory cache for weather data"""
    
    def __init__(self, ttl_seconds: int = 3600):
        """
        Initialize cache
        
        Args:
            ttl_seconds: Time to live for cached data (default: 1 hour)
        """
        self._cache: Dict[str, tuple[datetime, WeatherResponse]] = {}
        self._ttl = timedelta(seconds=ttl_seconds)
    
    def _make_key(self, request: WeatherRequest) -> str:
        """Generate cache key from request"""
        start = request.start_date.isoformat() if request.start_date else "none"
        end = request.end_date.isoformat() if request.end_date else "none"
        return f"{request.lat:.4f}_{request.lng:.4f}_{start}_{end}"
    
    def get(self, request: WeatherRequest) -> Optional[WeatherResponse]:
        """Get cached weather data if available and not expired"""
        key = self._make_key(request)
        
        if key not in self._cache:
            return None
        
        cached_time, cached_data = self._cache[key]
        
        # Check if expired
        if datetime.utcnow() - cached_time > self._ttl:
            del self._cache[key]
            return None
        
        logger.debug(f"Cache hit for {key}")
        return cached_data
    
    def set(self, request: WeatherRequest, response: WeatherResponse):
        """Store weather data in cache"""
        key = self._make_key(request)
        self._cache[key] = (datetime.utcnow(), response)
        logger.debug(f"Cached data for {key}")
    
    def clear(self):
        """Clear all cached data"""
        self._cache.clear()
        logger.info("Cache cleared")
    
    def size(self) -> int:
        """Get number of cached items"""
        return len(self._cache)


class WeatherAggregator:
    """
    Aggregates weather data from multiple sources
    
    Combines:
    - Open-Meteo Marine API: wind, waves, temperature, pressure
    - NOAA RTOFS: ocean currents
    """
    
    def __init__(
        self,
        enable_cache: bool = True,
        cache_ttl: int = 3600,
        use_smart_cache: bool = True,
        max_days_ahead: int = 7,
        use_mock: bool = None
    ):
        """
        Initialize aggregator
        
        Args:
            enable_cache: Enable caching (default: True)
            cache_ttl: Cache TTL in seconds for legacy cache (default: 1 hour)
            use_smart_cache: Use SmartWeatherCache instead of legacy cache (default: True)
            max_days_ahead: Maximum days ahead for smart cache (default: 7)
            use_mock: Use mock data (default: from settings)
        """
        # Determine data source
        self.use_mock = use_mock if use_mock is not None else settings.use_mock_weather
        
        if self.use_mock:
            self.open_meteo = get_mock_open_meteo_service()
            logger.info("🎭 Using MOCK weather data (no API limits!)")
        else:
            self.open_meteo = get_open_meteo_service()
            logger.info("🌐 Using REAL Open-Meteo API")
        
        self.ocean_currents = get_ocean_currents_service()
        self.enable_cache = enable_cache
        self.use_smart_cache = use_smart_cache
        
        if enable_cache:
            if use_smart_cache:
                self.smart_cache = SmartWeatherCache(max_days_ahead=max_days_ahead)
                self.cache = None
                logger.info("✨ Using SmartWeatherCache for optimized caching")
            else:
                self.cache = WeatherCache(ttl_seconds=cache_ttl)
                self.smart_cache = None
                logger.info("📦 Using legacy WeatherCache")
        else:
            self.cache = None
            self.smart_cache = None
    
    async def get_weather_for_point(
        self,
        lat: float,
        lng: float,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        include_currents: bool = True
    ) -> WeatherResponse:
        """
        Get complete weather data for a single point
        
        Args:
            lat: Latitude
            lng: Longitude
            start_date: Start date for forecast (default: now)
            end_date: End date for forecast (default: now + 7 days)
            include_currents: Include ocean current data (default: True)
            
        Returns:
            WeatherResponse with aggregated data
        """
        # Create request object
        request = WeatherRequest(
            lat=lat,
            lng=lng,
            start_date=start_date,
            end_date=end_date
        )
        
        # Check cache
        if self.enable_cache and self.cache:
            cached = self.cache.get(request)
            if cached:
                return cached
        
        logger.info(f"Aggregating weather for ({lat}, {lng})")
        
        try:
            # Fetch Open-Meteo data (wind, waves, weather)
            weather_points = await self.open_meteo.fetch_marine_weather(
                lat, lng, start_date, end_date
            )
            
            # Add ocean currents if requested
            if include_currents:
                weather_points = await self._add_currents_to_points(weather_points)
            
            # Create response
            response = WeatherResponse(
                request=request,
                data=weather_points,
                source="Open-Meteo + NOAA RTOFS (mock)" if include_currents else "Open-Meteo",
                generated_at=datetime.utcnow()
            )
            
            # Cache the response
            if self.enable_cache and self.cache:
                self.cache.set(request, response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error aggregating weather data: {e}")
            raise
    
    async def _add_currents_to_points(
        self,
        weather_points: List[WeatherPoint]
    ) -> List[WeatherPoint]:
        """
        Add ocean current data to weather points
        
        Args:
            weather_points: List of weather points without current data
            
        Returns:
            List of weather points with current data added
        """
        if not weather_points:
            return weather_points
        
        logger.info(f"Adding currents to {len(weather_points)} weather points")
        
        # Fetch currents for each unique timestamp and location
        # For efficiency, we could batch these requests
        for point in weather_points:
            try:
                current_data = await self.ocean_currents.fetch_currents(
                    point.coordinates.lat,
                    point.coordinates.lng,
                    point.timestamp
                )
                point.currents = current_data
            except Exception as e:
                logger.warning(f"Failed to fetch currents for point: {e}")
                point.currents = None
        
        return weather_points
    
    async def get_weather_for_route(
        self,
        waypoints: List[tuple[float, float, datetime]],
        include_currents: bool = True
    ) -> List[WeatherPoint]:
        """
        Get weather data for multiple waypoints along a route
        
        Args:
            waypoints: List of (lat, lng, timestamp) tuples
            include_currents: Include ocean current data
            
        Returns:
            List of WeatherPoint objects, one per waypoint
        """
        logger.info(f"Fetching weather for {len(waypoints)} waypoints")
        
        weather_points = []
        
        # Fetch weather for each waypoint
        # Could be optimized with parallel requests
        tasks = []
        for lat, lng, timestamp in waypoints:
            task = self._get_weather_for_waypoint(lat, lng, timestamp, include_currents)
            tasks.append(task)
        
        # Execute all requests in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching weather for waypoint {i}: {result}")
                # Create a placeholder point with minimal data
                lat, lng, timestamp = waypoints[i]
                weather_points.append(self._create_fallback_point(lat, lng, timestamp))
            else:
                weather_points.append(result)
        
        return weather_points
    
    async def _get_weather_for_waypoint(
        self,
        lat: float,
        lng: float,
        timestamp: datetime,
        include_currents: bool
    ) -> WeatherPoint:
        """Get weather for a single waypoint"""
        # Fetch weather data for the specific time
        # We need to fetch a range and then find the closest point
        start_date = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        
        response = await self.get_weather_for_point(
            lat, lng, start_date, end_date, include_currents
        )
        
        if not response.data:
            return self._create_fallback_point(lat, lng, timestamp)
        
        # Find the closest weather point to the requested timestamp
        closest_point = min(
            response.data,
            key=lambda p: abs((p.timestamp - timestamp).total_seconds())
        )
        
        return closest_point
    
    def _create_fallback_point(
        self,
        lat: float,
        lng: float,
        timestamp: datetime
    ) -> WeatherPoint:
        """Create a fallback weather point with default values"""
        from models.weather import WindData, WaveData
        
        return WeatherPoint(
            coordinates=Coordinates(lat=lat, lng=lng),
            timestamp=timestamp,
            wind=WindData(speed=0.0, direction=0.0),
            waves=WaveData(height=0.0),
            currents=None,
            temperature=None,
            pressure=None,
            precipitation=None,
            visibility=None
        )
    
    async def get_weather_layer_data(
        self,
        layer_type: str,
        bbox: List[float],
        timestamp: Optional[datetime] = None,
        resolution: float = 2.0
    ) -> List[dict]:
        """
        Get weather data for a map layer (grid of points)
        
        Args:
            layer_type: Type of layer (wind, waves, currents, temperature)
            bbox: Bounding box [west, south, east, north]
            timestamp: Timestamp for the data
            resolution: Grid resolution in degrees
            
        Returns:
            List of data points for visualization
        """
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        west, south, east, north = bbox
        
        logger.info(f"Fetching {layer_type} layer data for bbox {bbox}, resolution={resolution}")
        
        # Limit grid size for performance
        lat_points = int((north - south) / resolution) + 1
        lng_points = int((east - west) / resolution) + 1
        total_points = lat_points * lng_points
        
        # Cap at reasonable limit
        max_points = 5000
        if total_points > max_points:
            # Adjust resolution to stay within limit
            new_resolution = max(
                (north - south) / 50,
                (east - west) / 50,
                resolution
            )
            logger.warning(
                f"Grid too large ({total_points} points), adjusting resolution to {new_resolution:.2f}°"
            )
            resolution = new_resolution
        
        if layer_type == "currents":
            return await self._fetch_currents_layer(bbox, timestamp, resolution)
        elif layer_type == "wind":
            return await self._fetch_wind_layer(bbox, timestamp, resolution)
        elif layer_type == "waves":
            return await self._fetch_waves_layer(bbox, timestamp, resolution)
        elif layer_type == "temperature":
            return await self._fetch_temperature_layer(bbox, timestamp, resolution)
        else:
            logger.warning(f"Layer type {layer_type} not supported")
            return []
    
    async def _fetch_currents_layer(
        self,
        bbox: List[float],
        timestamp: datetime,
        resolution: float
    ) -> List[dict]:
        """Fetch currents layer data"""
        currents_points = await self.ocean_currents.fetch_currents_grid(
            bbox, timestamp, resolution
        )
        
        # Convert to visualization format
        data_points = []
        for point in currents_points:
            data_points.append({
                "lat": point.lat,
                "lng": point.lng,
                "u": point.u,
                "v": point.v,
                "speed": (point.u**2 + point.v**2)**0.5 * 1.94384,  # m/s to knots
                "timestamp": point.timestamp.isoformat()
            })
        
        return data_points
    
    async def _fetch_wind_layer(
        self,
        bbox: List[float],
        timestamp: datetime,
        resolution: float
    ) -> List[dict]:
        """
        Fetch wind layer data using optimized batch requests with smart caching
        
        This method uses Open-Meteo's batch API capability to fetch data for
        multiple grid points in a single request, dramatically improving performance.
        Uses SmartWeatherCache to fetch 7 days of data and cache by date.
        """
        import numpy as np
        
        west, south, east, north = bbox
        target_date = timestamp.date()
        
        logger.info(f"📥 Fetching wind layer for {target_date}, bbox {bbox}, resolution={resolution}°")
        
        # Generate grid of coordinates
        lats = np.arange(south, north + resolution, resolution)
        lngs = np.arange(west, east + resolution, resolution)
        
        # Create all coordinate pairs
        coordinates = []
        for lat in lats:
            for lng in lngs:
                coordinates.append((float(lat), float(lng)))
        
        logger.info(f"Generated grid of {len(coordinates)} points")
        
        # Check smart cache if enabled
        if self.use_smart_cache and self.smart_cache:
            cached_data = self.smart_cache.get_day_data(target_date, coordinates)
            
            if len(cached_data) == len(coordinates):
                # Full cache hit - all coordinates are cached
                logger.info(f"✅ Full cache HIT for wind layer on {target_date} ({len(coordinates)} points)")
                return self._process_wind_data_from_cache(cached_data, timestamp)
            elif cached_data:
                # Partial cache hit
                logger.info(
                    f"⚡ Partial cache HIT: {len(cached_data)}/{len(coordinates)} points cached"
                )
                # Use cached data and fetch missing points
                missing_coords = [c for c in coordinates if c not in cached_data]
                batch_results = await self._fetch_and_cache_batch(
                    missing_coords, timestamp, days_ahead=7
                )
                # Combine cached and newly fetched data
                batch_results.update(cached_data)
            else:
                # Full cache miss
                logger.info(f"❌ Cache MISS for wind layer on {target_date}, fetching 7 days")
                batch_results = await self._fetch_and_cache_batch(
                    coordinates, timestamp, days_ahead=7
                )
        else:
            # No cache - fetch only the requested day
            start_date = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            
            try:
                batch_results = await self.open_meteo.fetch_marine_weather_batch(
                    coordinates, start_date, end_date, max_batch_size=100
                )
            except Exception as e:
                logger.error(f"Failed to fetch wind layer batch: {e}")
                return []
        
        # Process results and find closest timestamp
        return self._process_wind_data_from_cache(batch_results, timestamp)
    
    async def _fetch_and_cache_batch(
        self,
        coordinates: List[Tuple[float, float]],
        timestamp: datetime,
        days_ahead: int = 7
    ) -> Dict[Tuple[float, float], List[WeatherPoint]]:
        """
        Fetch weather data for coordinates and cache it
        
        Args:
            coordinates: List of (lat, lng) tuples
            timestamp: Reference timestamp
            days_ahead: Number of days to fetch ahead
            
        Returns:
            Dictionary mapping coordinates to weather points
        """
        start_date = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=days_ahead)
        
        logger.info(
            f"⬇️ Fetching {len(coordinates)} points for {days_ahead} days "
            f"({start_date.date()} to {end_date.date()})"
        )
        
        try:
            batch_results = await self.open_meteo.fetch_marine_weather_batch(
                coordinates, start_date, end_date, max_batch_size=100
            )
            
            # Cache the results if smart cache is enabled
            if self.use_smart_cache and self.smart_cache:
                self.smart_cache.set_multi_day(batch_results)
                logger.info(f"💾 Cached {len(batch_results)} coordinate sets for {days_ahead} days")
            
            return batch_results
            
        except Exception as e:
            logger.error(f"Failed to fetch and cache batch: {e}")
            return {}
    
    def _process_wind_data_from_cache(
        self,
        batch_results: Dict[Tuple[float, float], List[WeatherPoint]],
        timestamp: datetime
    ) -> List[dict]:
        """
        Process cached wind data and extract data for specific timestamp
        
        Args:
            batch_results: Dictionary mapping coordinates to weather points
            timestamp: Target timestamp
            
        Returns:
            List of wind data points
        """
        import numpy as np
        
        data_points = []
        
        for coord, weather_points in batch_results.items():
            if not weather_points:
                continue
            
            # Find weather point closest to requested timestamp
            closest_point = min(
                weather_points,
                key=lambda p: abs((p.timestamp - timestamp).total_seconds())
            )
            
            if closest_point.wind:
                lat, lng = coord
                speed = closest_point.wind.speed  # knots
                direction_deg = closest_point.wind.direction  # degrees
                
                # Convert wind direction to u,v components for visualization
                # Wind direction is "from" direction, so we add 180 to get "to" direction
                direction_rad = np.deg2rad((direction_deg + 180) % 360)
                u = speed * np.sin(direction_rad)
                v = speed * np.cos(direction_rad)
                
                data_points.append({
                    "lat": lat,
                    "lng": lng,
                    "speed": float(speed),
                    "direction": float(direction_deg),
                    "u": float(u),
                    "v": float(v),
                    "gust": float(closest_point.wind.gust) if closest_point.wind.gust else None,
                    "timestamp": closest_point.timestamp.isoformat()
                })
        
        logger.info(f"✅ Processed {len(data_points)} wind data points")
        return data_points
    
    async def _fetch_waves_layer(
        self,
        bbox: List[float],
        timestamp: datetime,
        resolution: float
    ) -> List[dict]:
        """
        Fetch waves layer data using optimized batch requests with smart caching
        
        This method uses Open-Meteo's batch API capability to fetch data for
        multiple grid points in a single request, dramatically improving performance.
        Uses SmartWeatherCache to fetch 7 days of data and cache by date.
        """
        import numpy as np
        
        west, south, east, north = bbox
        target_date = timestamp.date()
        
        logger.info(f"📥 Fetching waves layer for {target_date}, bbox {bbox}, resolution={resolution}°")
        
        # Generate grid of coordinates
        lats = np.arange(south, north + resolution, resolution)
        lngs = np.arange(west, east + resolution, resolution)
        
        # Create all coordinate pairs
        coordinates = []
        for lat in lats:
            for lng in lngs:
                coordinates.append((float(lat), float(lng)))
        
        logger.info(f"Generated grid of {len(coordinates)} points")
        
        # Check smart cache if enabled
        if self.use_smart_cache and self.smart_cache:
            cached_data = self.smart_cache.get_day_data(target_date, coordinates)
            
            if len(cached_data) == len(coordinates):
                logger.info(f"✅ Full cache HIT for waves layer on {target_date} ({len(coordinates)} points)")
                return self._process_waves_data_from_cache(cached_data, timestamp)
            elif cached_data:
                logger.info(
                    f"⚡ Partial cache HIT: {len(cached_data)}/{len(coordinates)} points cached"
                )
                missing_coords = [c for c in coordinates if c not in cached_data]
                batch_results = await self._fetch_and_cache_batch(
                    missing_coords, timestamp, days_ahead=7
                )
                batch_results.update(cached_data)
            else:
                logger.info(f"❌ Cache MISS for waves layer on {target_date}, fetching 7 days")
                batch_results = await self._fetch_and_cache_batch(
                    coordinates, timestamp, days_ahead=7
                )
        else:
            start_date = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            
            try:
                batch_results = await self.open_meteo.fetch_marine_weather_batch(
                    coordinates, start_date, end_date, max_batch_size=100
                )
            except Exception as e:
                logger.error(f"Failed to fetch waves layer batch: {e}")
                return []
        
        return self._process_waves_data_from_cache(batch_results, timestamp)
    
    def _process_waves_data_from_cache(
        self,
        batch_results: Dict[Tuple[float, float], List[WeatherPoint]],
        timestamp: datetime
    ) -> List[dict]:
        """Process cached waves data and extract data for specific timestamp"""
        data_points = []
        
        for coord, weather_points in batch_results.items():
            if not weather_points:
                continue
            
            closest_point = min(
                weather_points,
                key=lambda p: abs((p.timestamp - timestamp).total_seconds())
            )
            
            if closest_point.waves:
                lat, lng = coord
                
                data_points.append({
                    "lat": lat,
                    "lng": lng,
                    "height": float(closest_point.waves.height),
                    "direction": float(closest_point.waves.direction) if closest_point.waves.direction else None,
                    "period": float(closest_point.waves.period) if closest_point.waves.period else None,
                    "timestamp": closest_point.timestamp.isoformat()
                })
        
        logger.info(f"✅ Processed {len(data_points)} wave data points")
        return data_points
    
    async def _fetch_temperature_layer(
        self,
        bbox: List[float],
        timestamp: datetime,
        resolution: float
    ) -> List[dict]:
        """
        Fetch temperature layer data using optimized batch requests with smart caching
        
        This method uses Open-Meteo's batch API capability to fetch data for
        multiple grid points in a single request, dramatically improving performance.
        Uses SmartWeatherCache to fetch 7 days of data and cache by date.
        """
        import numpy as np
        
        west, south, east, north = bbox
        target_date = timestamp.date()
        
        logger.info(f"📥 Fetching temperature layer for {target_date}, bbox {bbox}, resolution={resolution}°")
        
        # Generate grid of coordinates
        lats = np.arange(south, north + resolution, resolution)
        lngs = np.arange(west, east + resolution, resolution)
        
        # Create all coordinate pairs
        coordinates = []
        for lat in lats:
            for lng in lngs:
                coordinates.append((float(lat), float(lng)))
        
        logger.info(f"Generated grid of {len(coordinates)} points")
        
        # Check smart cache if enabled
        if self.use_smart_cache and self.smart_cache:
            cached_data = self.smart_cache.get_day_data(target_date, coordinates)
            
            if len(cached_data) == len(coordinates):
                logger.info(f"✅ Full cache HIT for temperature layer on {target_date} ({len(coordinates)} points)")
                return self._process_temperature_data_from_cache(cached_data, timestamp)
            elif cached_data:
                logger.info(
                    f"⚡ Partial cache HIT: {len(cached_data)}/{len(coordinates)} points cached"
                )
                missing_coords = [c for c in coordinates if c not in cached_data]
                batch_results = await self._fetch_and_cache_batch(
                    missing_coords, timestamp, days_ahead=7
                )
                batch_results.update(cached_data)
            else:
                logger.info(f"❌ Cache MISS for temperature layer on {target_date}, fetching 7 days")
                batch_results = await self._fetch_and_cache_batch(
                    coordinates, timestamp, days_ahead=7
                )
        else:
            start_date = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            
            try:
                batch_results = await self.open_meteo.fetch_marine_weather_batch(
                    coordinates, start_date, end_date, max_batch_size=100
                )
            except Exception as e:
                logger.error(f"Failed to fetch temperature layer batch: {e}")
                return []
        
        return self._process_temperature_data_from_cache(batch_results, timestamp)
    
    def _process_temperature_data_from_cache(
        self,
        batch_results: Dict[Tuple[float, float], List[WeatherPoint]],
        timestamp: datetime
    ) -> List[dict]:
        """Process cached temperature data and extract data for specific timestamp"""
        data_points = []
        
        for coord, weather_points in batch_results.items():
            if not weather_points:
                continue
            
            closest_point = min(
                weather_points,
                key=lambda p: abs((p.timestamp - timestamp).total_seconds())
            )
            
            if closest_point.temperature is not None:
                lat, lng = coord
                
                data_points.append({
                    "lat": lat,
                    "lng": lng,
                    "temperature": float(closest_point.temperature),
                    "timestamp": closest_point.timestamp.isoformat()
                })
        
        logger.info(f"✅ Processed {len(data_points)} temperature data points")
        return data_points
    
    def clear_cache(self):
        """Clear the weather cache"""
        if self.smart_cache:
            self.smart_cache.clear()
        elif self.cache:
            self.cache.clear()
    
    def get_cache_size(self) -> int:
        """Get the number of cached items"""
        if self.smart_cache:
            stats = self.smart_cache.get_stats()
            return stats.get('points_cached', 0)
        elif self.cache:
            return self.cache.size()
        return 0
    
    def get_cache_stats(self) -> dict:
        """
        Get detailed cache statistics
        
        Returns:
            Dictionary with cache statistics
        """
        if self.smart_cache:
            return self.smart_cache.get_stats()
        elif self.cache:
            return {
                "cache_type": "legacy",
                "cached_items": self.cache.size()
            }
        else:
            return {
                "cache_type": "disabled",
                "cached_items": 0
            }
    
    def force_cache_cleanup(self):
        """Force immediate cache cleanup"""
        if self.smart_cache:
            self.smart_cache.force_cleanup()
            logger.info("🧹 Forced smart cache cleanup completed")


# Singleton instance
_weather_aggregator: Optional[WeatherAggregator] = None


def get_weather_aggregator(force_recreate: bool = False) -> WeatherAggregator:
    """
    Get singleton instance of WeatherAggregator
    
    Args:
        force_recreate: Force recreation of singleton (useful when settings change)
    """
    global _weather_aggregator
    if _weather_aggregator is None or force_recreate:
        _weather_aggregator = WeatherAggregator()
        logger.info("🔄 WeatherAggregator instance created/recreated")
    return _weather_aggregator

