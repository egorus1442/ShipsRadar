"""
Route calculation models
Pydantic models for route planning and optimization
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from models.weather import WeatherPoint, Coordinates


class RouteRequest(BaseModel):
    """Request for route calculation"""
    start: Coordinates = Field(..., description="Starting coordinates")
    end: Coordinates = Field(..., description="Ending coordinates")
    departure_time: datetime = Field(..., description="Departure time from start point")
    vessel_speed: float = Field(default=15.0, ge=5.0, le=30.0, description="Vessel speed in knots")
    waypoints_count: int = Field(default=20, ge=10, le=50, description="Number of waypoints to generate")
    avoid_extreme_weather: bool = Field(default=True, description="Whether to avoid extreme weather conditions")
    extreme_wind_threshold: float = Field(default=30.0, ge=20.0, description="Wind speed threshold in knots")
    extreme_wave_threshold: float = Field(default=5.0, ge=3.0, description="Wave height threshold in meters")


class Waypoint(BaseModel):
    """Single waypoint on a route"""
    id: int = Field(..., description="Waypoint sequence number (0-based)")
    coordinates: Coordinates
    eta: datetime = Field(..., description="Estimated Time of Arrival at this waypoint")
    distance_from_prev: float = Field(..., ge=0, description="Distance from previous waypoint in nautical miles")
    cumulative_distance: float = Field(..., ge=0, description="Total distance from start in nautical miles")
    weather: Optional[WeatherPoint] = Field(None, description="Weather forecast at ETA")
    is_adjusted: bool = Field(default=False, description="Whether this waypoint was adjusted to avoid weather")
    warnings: List[str] = Field(default_factory=list, description="Weather warnings for this waypoint")


class RouteMetrics(BaseModel):
    """Overall route metrics and statistics"""
    total_distance_nm: float = Field(..., ge=0, description="Total distance in nautical miles")
    total_distance_km: float = Field(..., ge=0, description="Total distance in kilometers")
    estimated_duration_hours: float = Field(..., ge=0, description="Estimated duration in hours")
    departure_time: datetime
    arrival_time: datetime
    average_speed_knots: float = Field(..., ge=0, description="Average speed in knots")
    waypoints_adjusted: int = Field(default=0, description="Number of waypoints adjusted for weather")
    max_wind_speed: Optional[float] = Field(None, description="Maximum wind speed encountered in knots")
    max_wave_height: Optional[float] = Field(None, description="Maximum wave height encountered in meters")


class RouteWarning(BaseModel):
    """Warning about route conditions"""
    severity: str = Field(..., description="Severity level: info, warning, danger")
    waypoint_id: int = Field(..., description="Waypoint ID where warning applies")
    message: str = Field(..., description="Warning message")
    parameter: str = Field(..., description="Parameter that triggered warning (wind, waves, etc.)")
    value: float = Field(..., description="Value of the parameter")


class RouteResponse(BaseModel):
    """Response with calculated route"""
    request: RouteRequest
    waypoints: List[Waypoint]
    metrics: RouteMetrics
    warnings: List[RouteWarning] = Field(default_factory=list)
    algorithm: str = Field(default="simple_great_circle", description="Algorithm used for calculation")
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    calculation_time_ms: Optional[float] = Field(None, description="Time taken to calculate route in milliseconds")


class RouteCalculationError(BaseModel):
    """Error response for route calculation"""
    error: str
    details: Optional[str] = None
    request: Optional[RouteRequest] = None

