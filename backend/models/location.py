"""
Pydantic models for Location and Geocoding
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal
from enum import Enum


class CoordinateFormat(str, Enum):
    """Supported coordinate formats"""
    DECIMAL = "decimal"  # 35.4437, 139.6380
    DMS = "dms"  # 35°26'37"N, 139°38'17"E


class Coordinates(BaseModel):
    """Geographic coordinates"""
    lng: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    lat: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    
    class Config:
        json_schema_extra = {
            "example": {
                "lng": 139.6380,
                "lat": 35.4437
            }
        }


class LocationRequest(BaseModel):
    """Request for geocoding (address/name to coordinates)"""
    query: str = Field(..., min_length=2, description="Location name, address, or coordinates")
    limit: int = Field(default=5, ge=1, le=10, description="Maximum number of results")
    types: Optional[List[str]] = Field(
        default=None,
        description="Filter by place types (e.g., 'place', 'poi', 'address')"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "Singapore Port",
                "limit": 5
            }
        }


class ReverseGeocodeRequest(BaseModel):
    """Request for reverse geocoding (coordinates to address)"""
    coordinates: Coordinates
    types: Optional[List[str]] = Field(
        default=None,
        description="Filter by place types"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "coordinates": {
                    "lng": 103.8198,
                    "lat": 1.3521
                }
            }
        }


class LocationFeature(BaseModel):
    """Single geocoding result feature"""
    id: str = Field(..., description="Unique identifier")
    place_name: str = Field(..., description="Full place name")
    text: str = Field(..., description="Short place name")
    place_type: List[str] = Field(..., description="Types of this place")
    coordinates: Coordinates
    relevance: float = Field(..., ge=0, le=1, description="Relevance score (0-1)")
    context: Optional[List[dict]] = Field(default=None, description="Hierarchical context (region, country, etc)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "place.123",
                "place_name": "Singapore, Singapore",
                "text": "Singapore",
                "place_type": ["place", "region"],
                "coordinates": {
                    "lng": 103.8198,
                    "lat": 1.3521
                },
                "relevance": 0.95,
                "context": [
                    {"id": "country.123", "text": "Singapore"}
                ]
            }
        }


class LocationResponse(BaseModel):
    """Response from geocoding API"""
    type: Literal["FeatureCollection"] = "FeatureCollection"
    query: str = Field(..., description="Original query")
    features: List[LocationFeature] = Field(..., description="List of matching locations")
    attribution: str = Field(default="Mapbox Geocoding API")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "FeatureCollection",
                "query": "Singapore Port",
                "features": [
                    {
                        "id": "place.123",
                        "place_name": "Singapore, Singapore",
                        "text": "Singapore",
                        "place_type": ["place"],
                        "coordinates": {
                            "lng": 103.8198,
                            "lat": 1.3521
                        },
                        "relevance": 0.95
                    }
                ],
                "attribution": "Mapbox Geocoding API"
            }
        }


class CoordinateParseResult(BaseModel):
    """Result of coordinate parsing"""
    coordinates: Coordinates
    format: CoordinateFormat
    original_input: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "coordinates": {
                    "lng": 139.6380,
                    "lat": 35.4437
                },
                "format": "decimal",
                "original_input": "35.4437, 139.6380"
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(default=None, description="Detailed error information")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Invalid coordinates format",
                "details": "Expected format: 'lat, lng' or 'lat°N/S, lng°E/W'"
            }
        }

