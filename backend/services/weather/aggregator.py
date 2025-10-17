"""
Weather Data Aggregator
Combines data from multiple sources (Open-Meteo, NOAA) into unified format
"""
from typing import List, Optional, Dict
from datetime import datetime, timedelta
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
from services.weather.ocean_currents import get_ocean_currents_service


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
    
    def __init__(self, enable_cache: bool = True, cache_ttl: int = 3600):
        """
        Initialize aggregator
        
        Args:
            enable_cache: Enable caching (default: True)
            cache_ttl: Cache TTL in seconds (default: 1 hour)
        """
        self.open_meteo = get_open_meteo_service()
        self.ocean_currents = get_ocean_currents_service()
        self.enable_cache = enable_cache
        self.cache = WeatherCache(ttl_seconds=cache_ttl) if enable_cache else None
    
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
        
        logger.info(f"Fetching {layer_type} layer data for bbox {bbox}")
        
        # For MVP, we'll support currents layer
        if layer_type == "currents":
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
                    "timestamp": point.timestamp.isoformat()
                })
            
            return data_points
        
        # For other layers, we would need to implement similar grid fetching
        # This is a placeholder for future implementation
        logger.warning(f"Layer type {layer_type} not yet implemented")
        return []
    
    def clear_cache(self):
        """Clear the weather cache"""
        if self.cache:
            self.cache.clear()
    
    def get_cache_size(self) -> int:
        """Get the number of cached items"""
        if self.cache:
            return self.cache.size()
        return 0


# Singleton instance
_weather_aggregator: Optional[WeatherAggregator] = None


def get_weather_aggregator() -> WeatherAggregator:
    """Get singleton instance of WeatherAggregator"""
    global _weather_aggregator
    if _weather_aggregator is None:
        _weather_aggregator = WeatherAggregator()
    return _weather_aggregator

