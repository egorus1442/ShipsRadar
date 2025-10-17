"""
Weather API endpoints
Provides access to marine weather data (wind, waves, currents)
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timedelta
from loguru import logger

from models.weather import (
    WeatherRequest,
    WeatherResponse,
    WeatherPoint,
    WeatherLayerRequest,
    WeatherLayerResponse
)
from services.weather.aggregator import get_weather_aggregator


router = APIRouter()


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format, default: now)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format, default: +7 days)"),
    include_currents: bool = Query(True, description="Include ocean current data")
):
    """
    Get weather forecast for a specific location
    
    Returns hourly weather data including:
    - Wind (speed, direction, gusts)
    - Waves (height, direction, period)
    - Ocean currents (speed, direction)
    - Temperature, pressure, precipitation
    
    **Example request:**
    ```
    GET /api/weather?lat=35.6762&lng=139.6503&include_currents=true
    ```
    """
    try:
        # Parse dates
        start_dt = None
        end_dt = None
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid start_date format: {e}")
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid end_date format: {e}")
        
        # Get aggregator
        aggregator = get_weather_aggregator()
        
        # Fetch weather data
        response = await aggregator.get_weather_for_point(
            lat=lat,
            lng=lng,
            start_date=start_dt,
            end_date=end_dt,
            include_currents=include_currents
        )
        
        logger.info(f"Weather data fetched for ({lat}, {lng}): {len(response.data)} points")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching weather data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather data: {str(e)}")


@router.post("/weather/batch", response_model=List[WeatherPoint])
async def get_weather_batch(
    waypoints: List[dict],
    include_currents: bool = Query(True, description="Include ocean current data")
):
    """
    Get weather data for multiple waypoints (batch request)
    
    Useful for route calculation where you need weather at multiple points
    
    **Request body:**
    ```json
    [
        {"lat": 35.6762, "lng": 139.6503, "timestamp": "2025-10-16T12:00:00Z"},
        {"lat": 40.7128, "lng": -74.0060, "timestamp": "2025-10-17T12:00:00Z"}
    ]
    ```
    
    Returns weather data for each waypoint at the specified time.
    """
    try:
        # Validate and parse waypoints
        parsed_waypoints = []
        for i, wp in enumerate(waypoints):
            try:
                lat = wp.get("lat")
                lng = wp.get("lng")
                timestamp_str = wp.get("timestamp")
                
                if lat is None or lng is None or timestamp_str is None:
                    raise ValueError("Each waypoint must have lat, lng, and timestamp")
                
                timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                parsed_waypoints.append((float(lat), float(lng), timestamp))
                
            except (ValueError, TypeError) as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid waypoint at index {i}: {e}"
                )
        
        if not parsed_waypoints:
            raise HTTPException(status_code=400, detail="No waypoints provided")
        
        # Get aggregator
        aggregator = get_weather_aggregator()
        
        # Fetch weather for all waypoints
        weather_points = await aggregator.get_weather_for_route(
            waypoints=parsed_waypoints,
            include_currents=include_currents
        )
        
        logger.info(f"Weather data fetched for {len(weather_points)} waypoints")
        return weather_points
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching batch weather data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch batch weather data: {str(e)}")


@router.get("/weather/point", response_model=WeatherPoint)
async def get_weather_point(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude"),
    timestamp: Optional[str] = Query(None, description="Timestamp (ISO format, default: now)"),
    include_currents: bool = Query(True, description="Include ocean current data")
):
    """
    Get weather data for a single point at a specific time
    
    Returns a single weather data point (closest to requested time)
    
    **Example:**
    ```
    GET /api/weather/point?lat=35.6762&lng=139.6503&timestamp=2025-10-16T12:00:00Z
    ```
    """
    try:
        # Parse timestamp
        ts = datetime.utcnow()
        if timestamp:
            try:
                ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid timestamp format: {e}")
        
        # Get aggregator
        aggregator = get_weather_aggregator()
        
        # Fetch weather for the specific time
        weather_point = await aggregator._get_weather_for_waypoint(
            lat=lat,
            lng=lng,
            timestamp=ts,
            include_currents=include_currents
        )
        
        logger.info(f"Weather point fetched for ({lat}, {lng}) at {ts}")
        return weather_point
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching weather point: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather point: {str(e)}")


@router.post("/weather/layer", response_model=WeatherLayerResponse)
async def get_weather_layer(request: WeatherLayerRequest):
    """
    Get weather layer data for map visualization
    
    Returns gridded weather data for a bounding box.
    Useful for rendering weather overlays on the map.
    
    **Supported layer types:**
    - `wind`: Wind speed and direction
    - `waves`: Wave height
    - `currents`: Ocean current vectors
    - `temperature`: Sea surface temperature
    
    **Request body:**
    ```json
    {
        "layer_type": "currents",
        "bbox": [-180, -90, 180, 90],
        "timestamp": "2025-10-16T12:00:00Z",
        "resolution": "medium"
    }
    ```
    """
    try:
        # Parse timestamp
        timestamp = request.timestamp or datetime.utcnow()
        
        # Validate bbox
        if len(request.bbox) != 4:
            raise HTTPException(status_code=400, detail="bbox must have exactly 4 values [west, south, east, north]")
        
        west, south, east, north = request.bbox
        if not (-180 <= west <= 180 and -180 <= east <= 180):
            raise HTTPException(status_code=400, detail="Invalid longitude range in bbox")
        if not (-90 <= south <= 90 and -90 <= north <= 90):
            raise HTTPException(status_code=400, detail="Invalid latitude range in bbox")
        if west >= east or south >= north:
            raise HTTPException(status_code=400, detail="Invalid bbox: west must be < east, south must be < north")
        
        # Determine resolution
        resolution_map = {
            "low": 5.0,
            "medium": 2.0,
            "high": 1.0
        }
        resolution = resolution_map.get(request.resolution, 2.0)
        
        # Get aggregator
        aggregator = get_weather_aggregator()
        
        # Fetch layer data
        data_points = await aggregator.get_weather_layer_data(
            layer_type=request.layer_type,
            bbox=request.bbox,
            timestamp=timestamp,
            resolution=resolution
        )
        
        # Create response
        response = WeatherLayerResponse(
            layer_type=request.layer_type,
            bbox=request.bbox,
            timestamp=timestamp,
            data_points=data_points,
            metadata={
                "resolution": request.resolution,
                "point_count": len(data_points),
                "source": "Open-Meteo + NOAA"
            }
        )
        
        logger.info(f"Weather layer '{request.layer_type}' fetched: {len(data_points)} points")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching weather layer: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather layer: {str(e)}")


@router.get("/weather/cache/stats")
async def get_cache_stats():
    """
    Get detailed weather cache statistics
    
    Returns comprehensive information about the cache state including:
    - Hit/miss rates
    - Number of cached days and points
    - Memory usage estimate
    - API requests saved
    
    **Example response:**
    ```json
    {
        "enabled": true,
        "cache_type": "smart",
        "hits": 150,
        "misses": 10,
        "hit_rate": 93.75,
        "days_cached": 3,
        "points_cached": 300,
        "api_requests_saved": 150,
        "memory_mb": 0.15,
        "cache_range": {
            "start": "2025-10-17",
            "end": "2025-10-24"
        }
    }
    ```
    """
    try:
        aggregator = get_weather_aggregator()
        stats = aggregator.get_cache_stats()
        
        stats["enabled"] = aggregator.enable_cache
        stats["cache_type"] = "smart" if aggregator.use_smart_cache else "legacy"
        
        return stats
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/weather/cache/clear")
async def clear_cache():
    """
    Clear the weather cache
    
    Useful for testing or when you want fresh data
    """
    try:
        aggregator = get_weather_aggregator()
        aggregator.clear_cache()
        
        return {
            "status": "success",
            "message": "Weather cache cleared"
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

