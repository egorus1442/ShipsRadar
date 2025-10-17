"""
Open-Meteo Marine Weather API Integration
Free marine weather API for wind, waves, and weather data
"""
import httpx
from typing import List, Optional
from datetime import datetime, timedelta
from loguru import logger

from models.weather import (
    WindData,
    WaveData,
    WeatherPoint,
    Coordinates,
    OpenMeteoResponse
)


class OpenMeteoService:
    """Service for fetching marine weather data from Open-Meteo API"""
    
    BASE_URL = "https://marine-api.open-meteo.com/v1/marine"
    
    # Open-Meteo Marine API parameters
    MARINE_PARAMS = [
        "wave_height",           # Significant wave height (m)
        "wave_direction",        # Wave direction (°)
        "wave_period",           # Wave period (s)
        "wind_wave_height",      # Wind wave height (m)
        "wind_wave_direction",   # Wind wave direction (°)
        "wind_wave_period",      # Wind wave period (s)
        "swell_wave_height",     # Swell wave height (m)
        "swell_wave_direction",  # Swell wave direction (°)
        "swell_wave_period",     # Swell wave period (s)
    ]
    
    # Additional weather parameters from regular Open-Meteo
    WEATHER_PARAMS = [
        "temperature_2m",        # Air temperature at 2m (°C)
        "surface_pressure",      # Surface pressure (hPa)
        "precipitation",         # Precipitation (mm)
        "wind_speed_10m",        # Wind speed at 10m (km/h)
        "wind_direction_10m",    # Wind direction at 10m (°)
        "wind_gusts_10m",        # Wind gusts at 10m (km/h)
    ]
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    def _convert_kmh_to_knots(self, speed_kmh: float) -> float:
        """Convert km/h to knots"""
        return speed_kmh * 0.539957
    
    def _convert_mps_to_knots(self, speed_mps: float) -> float:
        """Convert m/s to knots"""
        return speed_mps * 1.94384
    
    async def fetch_marine_weather(
        self,
        lat: float,
        lng: float,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[WeatherPoint]:
        """
        Fetch marine weather data from Open-Meteo API
        
        Args:
            lat: Latitude (-90 to 90)
            lng: Longitude (-180 to 180)
            start_date: Start date for forecast (default: now)
            end_date: End date for forecast (default: now + 7 days)
            
        Returns:
            List of WeatherPoint objects with weather data
        """
        # Set default dates
        if start_date is None:
            start_date = datetime.utcnow()
        if end_date is None:
            end_date = start_date + timedelta(days=7)
        
        logger.info(f"Fetching marine weather for ({lat}, {lng}) from {start_date} to {end_date}")
        
        try:
            # Fetch marine data (waves)
            marine_data = await self._fetch_marine_data(lat, lng, start_date, end_date)
            
            # Fetch weather data (wind, temperature, pressure)
            weather_data = await self._fetch_weather_data(lat, lng, start_date, end_date)
            
            # Combine and parse data
            weather_points = self._parse_combined_data(
                lat, lng, marine_data, weather_data, start_date, end_date
            )
            
            logger.info(f"Successfully fetched {len(weather_points)} weather points")
            return weather_points
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching Open-Meteo data: {e}")
            raise
        except Exception as e:
            logger.error(f"Error fetching Open-Meteo data: {e}")
            raise
    
    async def _fetch_marine_data(
        self,
        lat: float,
        lng: float,
        start_date: datetime,
        end_date: datetime
    ) -> dict:
        """Fetch marine data (waves) from Open-Meteo Marine API"""
        params = {
            "latitude": lat,
            "longitude": lng,
            "hourly": ",".join(self.MARINE_PARAMS),
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "timezone": "UTC"
        }
        
        logger.debug(f"Fetching marine data with params: {params}")
        response = await self.client.get(self.BASE_URL, params=params)
        response.raise_for_status()
        
        return response.json()
    
    async def _fetch_weather_data(
        self,
        lat: float,
        lng: float,
        start_date: datetime,
        end_date: datetime
    ) -> dict:
        """Fetch weather data (wind, temperature) from Open-Meteo Weather API"""
        weather_url = "https://api.open-meteo.com/v1/forecast"
        
        params = {
            "latitude": lat,
            "longitude": lng,
            "hourly": ",".join(self.WEATHER_PARAMS),
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "timezone": "UTC"
        }
        
        logger.debug(f"Fetching weather data with params: {params}")
        response = await self.client.get(weather_url, params=params)
        response.raise_for_status()
        
        return response.json()
    
    def _parse_combined_data(
        self,
        lat: float,
        lng: float,
        marine_data: dict,
        weather_data: dict,
        start_date: datetime,
        end_date: datetime
    ) -> List[WeatherPoint]:
        """Parse and combine marine and weather data into WeatherPoint objects"""
        weather_points = []
        
        # Get hourly data arrays
        marine_hourly = marine_data.get("hourly", {})
        weather_hourly = weather_data.get("hourly", {})
        
        # Get time arrays (should be the same for both)
        marine_times = marine_hourly.get("time", [])
        weather_times = weather_hourly.get("time", [])
        
        if not marine_times and not weather_times:
            logger.warning("No time data available")
            return []
        
        # Use marine times as primary (more relevant for maritime use)
        times = marine_times if marine_times else weather_times
        
        for i, time_str in enumerate(times):
            try:
                timestamp = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
                
                # Skip if outside requested range
                if timestamp < start_date or timestamp > end_date:
                    continue
                
                # Extract wind data
                wind_speed_kmh = self._get_value(weather_hourly, "wind_speed_10m", i)
                wind_direction = self._get_value(weather_hourly, "wind_direction_10m", i)
                wind_gust_kmh = self._get_value(weather_hourly, "wind_gusts_10m", i)
                
                if wind_speed_kmh is None or wind_direction is None:
                    logger.warning(f"Missing wind data at index {i}, skipping")
                    continue
                
                wind_data = WindData(
                    speed=self._convert_kmh_to_knots(wind_speed_kmh),
                    direction=wind_direction,
                    gust=self._convert_kmh_to_knots(wind_gust_kmh) if wind_gust_kmh else None
                )
                
                # Extract wave data
                wave_height = self._get_value(marine_hourly, "wave_height", i)
                wave_direction = self._get_value(marine_hourly, "wave_direction", i)
                wave_period = self._get_value(marine_hourly, "wave_period", i)
                
                if wave_height is None:
                    logger.warning(f"Missing wave data at index {i}, using defaults")
                    wave_height = 0.0
                
                wave_data = WaveData(
                    height=wave_height,
                    direction=wave_direction,
                    period=wave_period
                )
                
                # Extract additional weather parameters
                temperature = self._get_value(weather_hourly, "temperature_2m", i)
                pressure = self._get_value(weather_hourly, "surface_pressure", i)
                precipitation = self._get_value(weather_hourly, "precipitation", i)
                
                # Create weather point
                weather_point = WeatherPoint(
                    coordinates=Coordinates(lat=lat, lng=lng),
                    timestamp=timestamp,
                    wind=wind_data,
                    waves=wave_data,
                    currents=None,  # Will be added by aggregator
                    temperature=temperature,
                    pressure=pressure,
                    precipitation=precipitation,
                    visibility=None  # Not available in Open-Meteo
                )
                
                weather_points.append(weather_point)
                
            except Exception as e:
                logger.warning(f"Error parsing data at index {i}: {e}")
                continue
        
        return weather_points
    
    def _get_value(self, data: dict, key: str, index: int) -> Optional[float]:
        """Safely get a value from data array"""
        try:
            values = data.get(key, [])
            if not values or index >= len(values):
                return None
            value = values[index]
            return float(value) if value is not None else None
        except (ValueError, TypeError, IndexError):
            return None
    
    async def fetch_point_forecast(
        self,
        lat: float,
        lng: float,
        timestamp: Optional[datetime] = None
    ) -> Optional[WeatherPoint]:
        """
        Fetch weather forecast for a specific point and time
        
        Args:
            lat: Latitude
            lng: Longitude
            timestamp: Specific timestamp (default: current time)
            
        Returns:
            WeatherPoint or None if not available
        """
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        # Fetch data for the day containing the timestamp
        start_date = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        
        weather_points = await self.fetch_marine_weather(lat, lng, start_date, end_date)
        
        # Find the closest point to the requested timestamp
        if not weather_points:
            return None
        
        closest_point = min(
            weather_points,
            key=lambda p: abs((p.timestamp - timestamp).total_seconds())
        )
        
        return closest_point


# Singleton instance
_open_meteo_service: Optional[OpenMeteoService] = None


def get_open_meteo_service() -> OpenMeteoService:
    """Get singleton instance of OpenMeteoService"""
    global _open_meteo_service
    if _open_meteo_service is None:
        _open_meteo_service = OpenMeteoService()
    return _open_meteo_service

