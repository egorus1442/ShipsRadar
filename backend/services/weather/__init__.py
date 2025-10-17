"""
Weather data services
"""
from services.weather.open_meteo import OpenMeteoService, get_open_meteo_service
from services.weather.ocean_currents import OceanCurrentsService, get_ocean_currents_service
from services.weather.aggregator import WeatherAggregator, get_weather_aggregator

__all__ = [
    "OpenMeteoService",
    "get_open_meteo_service",
    "OceanCurrentsService",
    "get_ocean_currents_service",
    "WeatherAggregator",
    "get_weather_aggregator",
]

