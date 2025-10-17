"""
Mock Weather Data Generator
Generates realistic weather data for testing and demonstration
"""
from typing import List, Tuple
from datetime import datetime, timedelta
import math
import random
from loguru import logger

from models.weather import WeatherPoint, WindData, WaveData, Coordinates


class MockWeatherDataGenerator:
    """
    Generates realistic mock weather data for testing
    
    Features:
    - Realistic patterns based on location
    - Temporal variation (day/night, weather systems)
    - Spatial coherence (nearby points have similar weather)
    """
    
    def __init__(self, seed: int = 42):
        """
        Initialize mock data generator
        
        Args:
            seed: Random seed for reproducible data
        """
        random.seed(seed)
        self._base_patterns = {}
        logger.info("🎭 MockWeatherDataGenerator initialized")
    
    def generate_weather_points(
        self,
        lat: float,
        lng: float,
        start_date: datetime,
        end_date: datetime,
        hourly: bool = True
    ) -> List[WeatherPoint]:
        """
        Generate weather points for a location and time range
        
        Args:
            lat: Latitude
            lng: Longitude
            start_date: Start datetime
            end_date: End datetime
            hourly: Generate hourly data (True) or daily (False)
            
        Returns:
            List of WeatherPoint objects
        """
        points = []
        
        # Generate timestamps
        if hourly:
            delta = timedelta(hours=1)
        else:
            delta = timedelta(days=1)
        
        current = start_date
        hour_offset = 0
        
        while current <= end_date:
            point = self._generate_point_for_timestamp(lat, lng, current, hour_offset)
            points.append(point)
            current += delta
            hour_offset += 1
        
        logger.debug(f"Generated {len(points)} mock weather points for ({lat:.2f}, {lng:.2f})")
        return points
    
    def _generate_point_for_timestamp(
        self,
        lat: float,
        lng: float,
        timestamp: datetime,
        hour_offset: int
    ) -> WeatherPoint:
        """Generate a single weather point with realistic patterns"""
        
        # Base patterns depend on latitude (climate zones)
        base_wind_speed = self._get_base_wind_speed(lat)
        base_wave_height = self._get_base_wave_height(lat)
        base_temperature = self._get_base_temperature(lat, timestamp)
        
        # Add temporal variation (weather systems moving through)
        # Use sine waves with different periods for realistic variation
        temporal_wind_factor = 1.0 + 0.3 * math.sin(hour_offset * 0.1) + 0.2 * math.sin(hour_offset * 0.05)
        temporal_wave_factor = 1.0 + 0.25 * math.sin(hour_offset * 0.08) + 0.15 * math.sin(hour_offset * 0.04)
        
        # Add spatial coherence (longitude affects wind direction)
        base_wind_direction = (lng + 180) % 360  # Wind patterns follow longitude
        wind_direction_offset = 30 * math.sin(hour_offset * 0.15)  # Wind direction changes over time
        
        # Generate wind data
        wind_speed = max(0, base_wind_speed * temporal_wind_factor + random.uniform(-2, 2))
        wind_direction = round((base_wind_direction + wind_direction_offset) % 360, 1)
        # Ensure direction is [0, 360) - модуло может дать ровно 360.0 после округления
        if wind_direction >= 360.0:
            wind_direction = 0.0
        wind_gust = wind_speed * random.uniform(1.2, 1.5)
        
        wind = WindData(
            speed=round(wind_speed, 1),  # knots
            direction=wind_direction,  # already rounded and validated
            gust=round(wind_gust, 1)
        )
        
        # Generate wave data (waves correlate with wind)
        wave_height = max(0.1, base_wave_height * temporal_wave_factor + random.uniform(-0.5, 0.5))
        # Waves follow wind, ensure direction is [0, 360)
        wave_direction = round((wind_direction + random.uniform(-30, 30)) % 360, 1)
        if wave_direction >= 360.0:
            wave_direction = 0.0
        wave_period = 4 + (wave_height * 2) + random.uniform(-1, 1)  # Period correlates with height
        
        waves = WaveData(
            height=round(wave_height, 2),  # meters
            direction=wave_direction,  # already rounded and validated
            period=round(wave_period, 1)  # seconds
        )
        
        # Temperature with diurnal cycle
        hour_of_day = timestamp.hour
        diurnal_variation = 3 * math.sin((hour_of_day - 6) * math.pi / 12)  # Peak at 14:00
        temperature = base_temperature + diurnal_variation + random.uniform(-1, 1)
        
        # Pressure (realistic range)
        base_pressure = 1013.25  # Standard sea level pressure
        pressure_variation = 10 * math.sin(hour_offset * 0.05)  # Weather systems
        pressure = base_pressure + pressure_variation + random.uniform(-2, 2)
        
        # Precipitation (occasional)
        precipitation = 0.0
        if random.random() < 0.15:  # 15% chance of rain
            precipitation = random.uniform(0.1, 5.0)
        
        return WeatherPoint(
            coordinates=Coordinates(lat=lat, lng=lng),
            timestamp=timestamp,
            wind=wind,
            waves=waves,
            currents=None,  # Currents require separate mock
            temperature=round(temperature, 1),
            pressure=round(pressure, 2),
            precipitation=round(precipitation, 1) if precipitation > 0 else None,
            visibility=random.uniform(5000, 20000)  # meters
        )
    
    def _get_base_wind_speed(self, lat: float) -> float:
        """Get base wind speed based on latitude (climate zones)"""
        abs_lat = abs(lat)
        
        if abs_lat < 5:
            # Equatorial doldrums - light winds
            return random.uniform(3, 8)
        elif abs_lat < 30:
            # Trade winds
            return random.uniform(10, 20)
        elif abs_lat < 40:
            # Horse latitudes - variable
            return random.uniform(8, 15)
        elif abs_lat < 60:
            # Westerlies - strong winds
            return random.uniform(15, 25)
        else:
            # Polar regions - very strong winds
            return random.uniform(20, 35)
    
    def _get_base_wave_height(self, lat: float) -> float:
        """Get base wave height based on latitude"""
        abs_lat = abs(lat)
        
        if abs_lat < 20:
            # Tropical - moderate waves
            return random.uniform(1.0, 2.5)
        elif abs_lat < 40:
            # Temperate - variable waves
            return random.uniform(1.5, 3.5)
        else:
            # High latitudes - rough seas
            return random.uniform(2.5, 5.0)
    
    def _get_base_temperature(self, lat: float, timestamp: datetime) -> float:
        """Get base temperature based on latitude and season"""
        abs_lat = abs(lat)
        
        # Base temperature by latitude
        if abs_lat < 23.5:
            # Tropics
            base = random.uniform(25, 30)
        elif abs_lat < 40:
            # Subtropics
            base = random.uniform(15, 25)
        elif abs_lat < 60:
            # Temperate
            base = random.uniform(5, 15)
        else:
            # Polar
            base = random.uniform(-10, 5)
        
        # Seasonal variation (simplified)
        day_of_year = timestamp.timetuple().tm_yday
        seasonal_factor = math.sin((day_of_year - 80) * 2 * math.pi / 365)  # Peak in summer
        
        # Northern/Southern hemisphere
        if lat >= 0:
            seasonal_adjustment = seasonal_factor * 10
        else:
            seasonal_adjustment = -seasonal_factor * 10
        
        return base + seasonal_adjustment


# Singleton instance
_mock_generator: MockWeatherDataGenerator = None


def get_mock_generator() -> MockWeatherDataGenerator:
    """Get singleton instance of MockWeatherDataGenerator"""
    global _mock_generator
    if _mock_generator is None:
        _mock_generator = MockWeatherDataGenerator()
    return _mock_generator

