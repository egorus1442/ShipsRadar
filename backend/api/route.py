"""
Route API endpoints
Handles route calculation and optimization requests
"""
from fastapi import APIRouter, HTTPException, status
from loguru import logger
from datetime import datetime, timezone

from models.route import RouteRequest, RouteResponse, RouteCalculationError
from services.route.calculator import get_route_calculator
from services.weather.aggregator import get_weather_aggregator


router = APIRouter()


@router.post("/route/calculate", response_model=RouteResponse)
async def calculate_route(request: RouteRequest):
    """
    Calculate optimal route between two points
    
    This endpoint:
    1. Generates waypoints along great circle path
    2. Calculates ETA for each waypoint
    3. Fetches weather forecast for each waypoint
    4. Adjusts route to avoid extreme weather conditions
    5. Returns complete route with metrics and warnings
    
    **Weather Avoidance:**
    - Wind threshold: {extreme_wind_threshold} knots (default: 30)
    - Wave threshold: {extreme_wave_threshold} meters (default: 5)
    - Adjustment distance: 50-100 nautical miles perpendicular to route
    
    **Route Metrics:**
    - Total distance in nautical miles and kilometers
    - Estimated duration and ETA
    - Weather statistics along route
    - Number of adjusted waypoints
    
    **Warnings:**
    - High wind warnings (>20 knots)
    - High wave warnings (>3 meters)
    - Dangerous conditions (>30 knots or >5 meters)
    """
    try:
        logger.info(f"Calculating route from ({request.start.lat}, {request.start.lng}) to ({request.end.lat}, {request.end.lng})")
        logger.info(f"Departure time: {request.departure_time}, Vessel speed: {request.vessel_speed} knots")
        
        # Get services
        calculator = get_route_calculator()
        weather_service = get_weather_aggregator()
        
        # Validate request
        if request.waypoints_count < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Waypoints count must be at least 2"
            )
        
        # Check if departure time is in the past (warning only)
        if request.departure_time < datetime.now(timezone.utc):
            logger.warning("Departure time is in the past")
        
        # Calculate route
        route_response = await calculator.calculate_route(request, weather_service)
        
        logger.info(
            f"Route calculated: {route_response.metrics.total_distance_nm:.2f} nm, "
            f"{route_response.metrics.estimated_duration_hours:.2f} hours, "
            f"{len(route_response.waypoints)} waypoints, "
            f"{len(route_response.warnings)} warnings"
        )
        
        return route_response
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error calculating route: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate route: {str(e)}"
        )


@router.get("/route/test")
async def test_route_calculation():
    """
    Test route calculation with predefined coordinates
    
    Calculates a sample route:
    - Start: Singapore (1.3521°N, 103.8198°E)
    - End: Rotterdam (51.9244°N, 4.4777°E)
    - Departure: Now
    - Speed: 15 knots
    - Waypoints: 20
    """
    from models.weather import Coordinates
    from datetime import timedelta
    
    # Sample route: Singapore to Rotterdam
    request = RouteRequest(
        start=Coordinates(lat=1.3521, lng=103.8198),
        end=Coordinates(lat=51.9244, lng=4.4777),
        departure_time=datetime.now(timezone.utc),
        vessel_speed=15.0,
        waypoints_count=20,
        avoid_extreme_weather=True,
        extreme_wind_threshold=30.0,
        extreme_wave_threshold=5.0
    )
    
    return await calculate_route(request)


@router.get("/route/sample")
async def get_sample_routes():
    """
    Get sample route requests for testing
    
    Returns predefined popular shipping routes
    """
    from models.weather import Coordinates
    
    samples = [
        {
            "name": "Singapore to Rotterdam",
            "description": "Major Asia-Europe shipping route via Suez Canal",
            "start": {"lat": 1.3521, "lng": 103.8198},
            "end": {"lat": 51.9244, "lng": 4.4777},
            "distance_estimate_nm": 8300
        },
        {
            "name": "Los Angeles to Shanghai",
            "description": "Trans-Pacific route",
            "start": {"lat": 33.7701, "lng": -118.1937},
            "end": {"lat": 31.2304, "lng": 121.4737},
            "distance_estimate_nm": 6000
        },
        {
            "name": "New York to London",
            "description": "Trans-Atlantic route",
            "start": {"lat": 40.6892, "lng": -74.0445},
            "end": {"lat": 51.5074, "lng": -0.1278},
            "distance_estimate_nm": 3000
        },
        {
            "name": "Panama to Sydney",
            "description": "Americas to Australia via Pacific",
            "start": {"lat": 8.9824, "lng": -79.5199},
            "end": {"lat": -33.8688, "lng": 151.2093},
            "distance_estimate_nm": 8500
        },
        {
            "name": "Dubai to Mumbai",
            "description": "Short Middle East to India route",
            "start": {"lat": 25.2048, "lng": 55.2708},
            "end": {"lat": 18.9388, "lng": 72.8354},
            "distance_estimate_nm": 1200
        }
    ]
    
    return {
        "samples": samples,
        "usage": "Use these coordinates to test route calculation",
        "example_request": {
            "start": samples[0]["start"],
            "end": samples[0]["end"],
            "departure_time": "2025-10-17T12:00:00Z",
            "vessel_speed": 15.0,
            "waypoints_count": 20,
            "avoid_extreme_weather": True,
            "extreme_wind_threshold": 30.0,
            "extreme_wave_threshold": 5.0
        }
    }


@router.get("/route/health")
async def route_health_check():
    """Health check for route calculation service"""
    try:
        calculator = get_route_calculator()
        weather_service = get_weather_aggregator()
        
        return {
            "status": "healthy",
            "calculator": "SimpleRouteCalculator",
            "weather_service": "active",
            "cache_size": weather_service.get_cache_size()
        }
    except Exception as e:
        logger.error(f"Route service health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Route service unavailable: {str(e)}"
        )

