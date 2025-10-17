"""
Weather data models
Pydantic models for weather data from various sources
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Coordinates(BaseModel):
    """Geographic coordinates"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    lng: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")


class WindData(BaseModel):
    """Wind data at a specific point and time"""
    speed: float = Field(..., ge=0, description="Wind speed in knots")
    direction: float = Field(..., ge=0, lt=360, description="Wind direction in degrees (0-360)")
    gust: Optional[float] = Field(None, ge=0, description="Wind gust speed in knots")


class WaveData(BaseModel):
    """Wave data at a specific point and time"""
    height: float = Field(..., ge=0, description="Significant wave height in meters")
    direction: Optional[float] = Field(None, ge=0, lt=360, description="Wave direction in degrees")
    period: Optional[float] = Field(None, ge=0, description="Wave period in seconds")


class CurrentData(BaseModel):
    """Ocean current data at a specific point and time"""
    u_component: float = Field(..., description="U component (east-west) in m/s")
    v_component: float = Field(..., description="V component (north-south) in m/s")
    speed: float = Field(..., ge=0, description="Current speed in knots")
    direction: float = Field(..., ge=0, lt=360, description="Current direction in degrees")


class WeatherPoint(BaseModel):
    """Complete weather data for a single point and time"""
    coordinates: Coordinates
    timestamp: datetime
    wind: WindData
    waves: WaveData
    currents: Optional[CurrentData] = Field(None, description="Ocean currents if available")
    temperature: Optional[float] = Field(None, description="Sea surface temperature in Celsius")
    pressure: Optional[float] = Field(None, ge=0, description="Air pressure in hPa")
    precipitation: Optional[float] = Field(None, ge=0, description="Precipitation in mm")
    visibility: Optional[float] = Field(None, ge=0, description="Visibility in km")


class WeatherRequest(BaseModel):
    """Request for weather data"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    start_date: Optional[datetime] = Field(None, description="Start date for forecast (defaults to now)")
    end_date: Optional[datetime] = Field(None, description="End date for forecast (defaults to +7 days)")


class WeatherResponse(BaseModel):
    """Response with weather data"""
    request: WeatherRequest
    data: List[WeatherPoint]
    source: str = Field(..., description="Data source (e.g., 'Open-Meteo', 'NOAA')")
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class OpenMeteoResponse(BaseModel):
    """Raw response from Open-Meteo Marine API"""
    latitude: float
    longitude: float
    hourly: dict
    hourly_units: dict


class NOAACurrentsPoint(BaseModel):
    """NOAA/RTOFS currents data point"""
    lat: float
    lng: float
    timestamp: datetime
    u: float = Field(..., description="U component in m/s")
    v: float = Field(..., description="V component in m/s")


class WeatherLayerRequest(BaseModel):
    """Request for weather layer data (for map visualization)"""
    layer_type: str = Field(..., description="Type of layer: wind, waves, currents, temperature")
    bbox: List[float] = Field(..., min_length=4, max_length=4, description="Bounding box [west, south, east, north]")
    timestamp: Optional[datetime] = Field(None, description="Timestamp for the data")
    resolution: Optional[str] = Field("medium", description="Resolution: low, medium, high")


class WeatherLayerResponse(BaseModel):
    """Response with weather layer data for visualization"""
    layer_type: str
    bbox: List[float]
    timestamp: datetime
    data_points: List[dict] = Field(..., description="Array of data points with coordinates and values")
    metadata: dict = Field(default_factory=dict, description="Metadata like units, ranges, etc.")

