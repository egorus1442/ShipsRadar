"""
Mock Open-Meteo Service
Provides mock weather data compatible with Open-Meteo API interface
"""
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
from loguru import logger

from models.weather import WeatherPoint
from services.weather.mock_data_generator import get_mock_generator


class MockOpenMeteoService:
    """
    Mock implementation of Open-Meteo Marine Weather API
    
    Provides the same interface as OpenMeteoService but returns
    generated mock data instead of making real API calls.
    """
    
    def __init__(self):
        """Initialize mock service"""
        self.generator = get_mock_generator()
        self.request_count = 0
        logger.info("🎭 MockOpenMeteoService initialized (no API limits!)")
    
    async def fetch_marine_weather(
        self,
        lat: float,
        lng: float,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[WeatherPoint]:
        """
        Mock: Fetch marine weather data for a single location
        
        Args:
            lat: Latitude
            lng: Longitude
            start_date: Start date (default: now)
            end_date: End date (default: now + 7 days)
            
        Returns:
            List of WeatherPoint objects
        """
        self.request_count += 1
        
        # Default date range
        if start_date is None:
            start_date = datetime.utcnow()
        if end_date is None:
            end_date = start_date + timedelta(days=7)
        
        logger.debug(
            f"🎭 Mock API call #{self.request_count}: "
            f"({lat:.2f}, {lng:.2f}) from {start_date.date()} to {end_date.date()}"
        )
        
        # Generate mock data
        weather_points = self.generator.generate_weather_points(
            lat, lng, start_date, end_date, hourly=True
        )
        
        return weather_points
    
    async def fetch_marine_weather_batch(
        self,
        coordinates: List[Tuple[float, float]],
        start_date: datetime,
        end_date: datetime,
        max_batch_size: int = 100
    ) -> Dict[Tuple[float, float], List[WeatherPoint]]:
        """
        Mock: Fetch marine weather data for multiple locations in batch
        
        Args:
            coordinates: List of (lat, lng) tuples
            start_date: Start date
            end_date: End date
            max_batch_size: Maximum points per batch (ignored in mock)
            
        Returns:
            Dictionary mapping (lat, lng) to list of WeatherPoint
        """
        self.request_count += 1
        
        logger.info(
            f"🎭 Mock BATCH API call #{self.request_count}: "
            f"{len(coordinates)} points from {start_date.date()} to {end_date.date()}"
        )
        
        # Generate mock data for all coordinates
        results = {}
        
        for lat, lng in coordinates:
            weather_points = self.generator.generate_weather_points(
                lat, lng, start_date, end_date, hourly=True
            )
            results[(lat, lng)] = weather_points
        
        logger.info(
            f"✅ Mock batch completed: {len(results)} locations, "
            f"~{len(weather_points) if weather_points else 0} hours each"
        )
        
        return results
    
    def get_request_count(self) -> int:
        """Get total number of API requests made"""
        return self.request_count
    
    def reset_request_count(self):
        """Reset request counter"""
        self.request_count = 0
        logger.info("🔄 Mock API request counter reset")


# Singleton instance
_mock_service: Optional[MockOpenMeteoService] = None


def get_mock_open_meteo_service() -> MockOpenMeteoService:
    """Get singleton instance of MockOpenMeteoService"""
    global _mock_service
    if _mock_service is None:
        _mock_service = MockOpenMeteoService()
    return _mock_service

