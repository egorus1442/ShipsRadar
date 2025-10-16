"""
Location API endpoints
Provides geocoding, reverse geocoding, and coordinate parsing
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from loguru import logger

from models.location import (
    LocationRequest,
    LocationResponse,
    ReverseGeocodeRequest,
    Coordinates,
    CoordinateParseResult,
    ErrorResponse
)
from services.geocoding import GeocodingService, CoordinateParser


router = APIRouter()
geocoding_service = GeocodingService()


@router.post(
    "/geocode",
    response_model=LocationResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Geocoding service error"}
    },
    summary="Forward geocoding",
    description="Convert location name, address, or coordinates to geographic coordinates"
)
async def geocode_location(request: LocationRequest):
    """
    Forward geocoding endpoint
    
    Accepts:
    - Location names: "Singapore", "Port of Rotterdam"
    - Addresses: "123 Main St, New York, NY"
    - Coordinates in various formats (will perform reverse geocoding)
    
    Returns list of matching locations with coordinates
    """
    try:
        logger.info(f"Geocoding request: '{request.query}' (limit={request.limit})")
        
        result = await geocoding_service.geocode(
            query=request.query,
            limit=request.limit,
            types=request.types
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Geocoding error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in geocoding: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/reverse-geocode",
    response_model=LocationResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid coordinates"},
        500: {"model": ErrorResponse, "description": "Reverse geocoding service error"}
    },
    summary="Reverse geocoding",
    description="Convert coordinates to location name/address"
)
async def reverse_geocode_location(request: ReverseGeocodeRequest):
    """
    Reverse geocoding endpoint
    
    Converts geographic coordinates to human-readable location name
    """
    try:
        logger.info(
            f"Reverse geocoding: ({request.coordinates.lat}, {request.coordinates.lng})"
        )
        
        result = await geocoding_service.reverse_geocode(
            coordinates=request.coordinates,
            types=request.types
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Reverse geocoding error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in reverse geocoding: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/parse-coordinates",
    response_model=CoordinateParseResult,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid coordinate format"}
    },
    summary="Parse coordinate string",
    description="Parse coordinates in various formats (decimal, DMS, DM)"
)
async def parse_coordinates(
    coords: str = Query(
        ...,
        description="Coordinate string to parse",
        examples=[
            "35.4437, 139.6380",
            "35°26'37\"N, 139°38'17\"E",
            "35°26.6167'N, 139°38.28'E"
        ]
    )
):
    """
    Parse coordinate string in various formats
    
    Supported formats:
    - Decimal: "35.4437, 139.6380"
    - DMS: "35°26'37"N, 139°38'17"E"
    - DM: "35°26.6167'N, 139°38.28'E"
    
    Returns parsed coordinates with format information
    """
    try:
        logger.info(f"Parsing coordinates: '{coords}'")
        
        result = CoordinateParser.parse(coords)
        
        if result is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid coordinate format. Supported formats: "
                       "Decimal (35.4437, 139.6380), "
                       "DMS (35°26'37\"N, 139°38'17\"E), "
                       "DM (35°26.6167'N, 139°38.28'E)"
            )
        
        logger.info(f"Successfully parsed: {result.format} format")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in coordinate parsing: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get(
    "/autocomplete",
    response_model=LocationResponse,
    summary="Autocomplete location search",
    description="Search for locations with autocomplete suggestions"
)
async def autocomplete_location(
    query: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(default=5, ge=1, le=10, description="Maximum results"),
    types: Optional[str] = Query(
        default=None,
        description="Comma-separated place types (e.g., 'place,poi,address')"
    )
):
    """
    Autocomplete endpoint for location search
    
    Optimized for typeahead/autocomplete UI components
    Returns relevant location suggestions as user types
    """
    try:
        logger.info(f"Autocomplete request: '{query}'")
        
        types_list = types.split(",") if types else None
        
        result = await geocoding_service.geocode(
            query=query,
            limit=limit,
            types=types_list
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Autocomplete error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in autocomplete: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

