"""
Geocoding service - converts between addresses and coordinates
Integrates with Mapbox Geocoding API
"""
import re
import httpx
from typing import Optional, List, Tuple
from loguru import logger

from config import settings
from models.location import (
    Coordinates,
    LocationFeature,
    LocationResponse,
    CoordinateParseResult,
    CoordinateFormat
)


class CoordinateParser:
    """Parses coordinates in various formats"""
    
    # Regex patterns for coordinate formats
    DECIMAL_PATTERN = re.compile(
        r'^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$'
    )
    
    DMS_PATTERN = re.compile(
        r"(\d+)°\s*(\d+)?'?\s*(\d+(?:\.\d+)?)?\s*\"?\s*([NSEW])"
        r"[,\s]+"
        r"(\d+)°\s*(\d+)?'?\s*(\d+(?:\.\d+)?)?\s*\"?\s*([NSEW])",
        re.IGNORECASE
    )
    
    DM_PATTERN = re.compile(
        r"(\d+)°\s*(\d+(?:\.\d+)?)?'?\s*([NSEW])"
        r"[,\s]+"
        r"(\d+)°\s*(\d+(?:\.\d+)?)?'?\s*([NSEW])",
        re.IGNORECASE
    )
    
    @staticmethod
    def parse(input_str: str) -> Optional[CoordinateParseResult]:
        """
        Parse coordinate string in various formats
        
        Supported formats:
        - Decimal: "35.4437, 139.6380" or "35.4437 139.6380"
        - DMS: "35°26'37"N, 139°38'17"E"
        - DM: "35°26.6167'N, 139°38.28'E"
        
        Returns:
            CoordinateParseResult if parsing successful, None otherwise
        """
        input_str = input_str.strip()
        
        # Try decimal format first
        result = CoordinateParser._parse_decimal(input_str)
        if result:
            return result
        
        # Try DMS format
        result = CoordinateParser._parse_dms(input_str)
        if result:
            return result
        
        # Try DM format
        result = CoordinateParser._parse_dm(input_str)
        if result:
            return result
        
        return None
    
    @staticmethod
    def _parse_decimal(input_str: str) -> Optional[CoordinateParseResult]:
        """Parse decimal format: "35.4437, 139.6380" """
        match = CoordinateParser.DECIMAL_PATTERN.match(input_str)
        if not match:
            return None
        
        try:
            lat = float(match.group(1))
            lng = float(match.group(2))
            
            # Validate ranges
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                return None
            
            return CoordinateParseResult(
                coordinates=Coordinates(lat=lat, lng=lng),
                format=CoordinateFormat.DECIMAL,
                original_input=input_str
            )
        except (ValueError, IndexError):
            return None
    
    @staticmethod
    def _parse_dms(input_str: str) -> Optional[CoordinateParseResult]:
        """Parse DMS format: 35°26'37"N, 139°38'17"E"""
        match = CoordinateParser.DMS_PATTERN.match(input_str)
        if not match:
            return None
        
        try:
            # Parse latitude
            lat_deg = int(match.group(1))
            lat_min = int(match.group(2) or 0)
            lat_sec = float(match.group(3) or 0)
            lat_dir = match.group(4).upper()
            
            lat = lat_deg + lat_min / 60 + lat_sec / 3600
            if lat_dir in ['S', 's']:
                lat = -lat
            
            # Parse longitude
            lng_deg = int(match.group(5))
            lng_min = int(match.group(6) or 0)
            lng_sec = float(match.group(7) or 0)
            lng_dir = match.group(8).upper()
            
            lng = lng_deg + lng_min / 60 + lng_sec / 3600
            if lng_dir in ['W', 'w']:
                lng = -lng
            
            # Validate ranges
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                return None
            
            return CoordinateParseResult(
                coordinates=Coordinates(lat=lat, lng=lng),
                format=CoordinateFormat.DMS,
                original_input=input_str
            )
        except (ValueError, IndexError):
            return None
    
    @staticmethod
    def _parse_dm(input_str: str) -> Optional[CoordinateParseResult]:
        """Parse DM (Degrees Minutes) format: 35°26.6167'N, 139°38.28'E"""
        match = CoordinateParser.DM_PATTERN.match(input_str)
        if not match:
            return None
        
        try:
            # Parse latitude
            lat_deg = int(match.group(1))
            lat_min = float(match.group(2) or 0)
            lat_dir = match.group(3).upper()
            
            lat = lat_deg + lat_min / 60
            if lat_dir in ['S', 's']:
                lat = -lat
            
            # Parse longitude
            lng_deg = int(match.group(4))
            lng_min = float(match.group(5) or 0)
            lng_dir = match.group(6).upper()
            
            lng = lng_deg + lng_min / 60
            if lng_dir in ['W', 'w']:
                lng = -lng
            
            # Validate ranges
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                return None
            
            return CoordinateParseResult(
                coordinates=Coordinates(lat=lat, lng=lng),
                format=CoordinateFormat.DM,
                original_input=input_str
            )
        except (ValueError, IndexError):
            return None


class GeocodingService:
    """Service for geocoding and reverse geocoding using Nominatim (OpenStreetMap)"""
    
    # Nominatim API - бесплатно, без регистрации!
    NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize geocoding service (no API key needed for Nominatim!)"""
        self.api_key = api_key  # Оставлено для совместимости, но не используется
        logger.info("Using Nominatim (OpenStreetMap) for geocoding - no API key required!")
    
    async def geocode(
        self,
        query: str,
        limit: int = 5,
        types: Optional[List[str]] = None
    ) -> LocationResponse:
        """
        Forward geocoding: convert address/name to coordinates using Nominatim
        
        Args:
            query: Search query (address, place name, or coordinates)
            limit: Maximum number of results
            types: Filter by place types (not used in Nominatim)
        
        Returns:
            LocationResponse with matching features
        """
        # First, try to parse as coordinates
        parsed_coords = CoordinateParser.parse(query)
        if parsed_coords:
            # If it's coordinates, do reverse geocoding instead
            logger.info(f"Query is coordinates, performing reverse geocoding: {parsed_coords.coordinates}")
            return await self.reverse_geocode(
                parsed_coords.coordinates,
                types=types
            )
        
        # Forward geocoding with Nominatim
        url = f"{self.NOMINATIM_BASE_URL}/search"
        params = {
            "q": query,
            "format": "json",
            "limit": limit,
            "addressdetails": 1,
        }
        
        headers = {
            "User-Agent": "ShipsRadar/1.0"  # Nominatim требует User-Agent
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
            
            features = []
            for idx, item in enumerate(data):
                # Определяем тип места
                place_types = []
                if item.get("type"):
                    place_types.append(item["type"])
                if item.get("class"):
                    place_types.append(item["class"])
                if not place_types:
                    place_types = ["place"]
                
                # Создаем feature
                feature = LocationFeature(
                    id=f"nominatim-{item.get('place_id', idx)}",
                    place_name=item.get("display_name", query),
                    text=item.get("name", query),
                    place_type=place_types,
                    coordinates=Coordinates(
                        lng=float(item["lon"]),
                        lat=float(item["lat"])
                    ),
                    relevance=1.0 - (idx * 0.1),  # Простая оценка релевантности
                    context=None  # Nominatim не предоставляет контекст в таком формате
                )
                features.append(feature)
            
            logger.info(f"Nominatim geocoding successful: {len(features)} results for '{query}'")
            
            return LocationResponse(
                query=query,
                features=features,
                attribution="© OpenStreetMap contributors"
            )
            
        except httpx.HTTPError as e:
            logger.error(f"Nominatim geocoding error: {e}")
            raise ValueError(f"Geocoding failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in geocoding: {e}")
            raise ValueError(f"Geocoding failed: {str(e)}")
    
    async def reverse_geocode(
        self,
        coordinates: Coordinates,
        types: Optional[List[str]] = None
    ) -> LocationResponse:
        """
        Reverse geocoding: convert coordinates to address/name using Nominatim
        
        Args:
            coordinates: Geographic coordinates
            types: Filter by place types (not used in Nominatim)
        
        Returns:
            LocationResponse with matching features
        """
        url = f"{self.NOMINATIM_BASE_URL}/reverse"
        params = {
            "lat": coordinates.lat,
            "lon": coordinates.lng,
            "format": "json",
            "addressdetails": 1,
        }
        
        headers = {
            "User-Agent": "ShipsRadar/1.0"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers, timeout=10.0)
                response.raise_for_status()
                data = response.json()
            
            # Nominatim возвращает один результат для reverse geocoding
            if "error" in data:
                logger.warning(f"Nominatim reverse geocoding: {data['error']}")
                # Возвращаем координаты как fallback
                features = [
                    LocationFeature(
                        id="unknown",
                        place_name=f"{coordinates.lat:.4f}°, {coordinates.lng:.4f}°",
                        text="Unknown location",
                        place_type=["coordinate"],
                        coordinates=coordinates,
                        relevance=1.0,
                        context=None
                    )
                ]
            else:
                place_types = []
                if data.get("type"):
                    place_types.append(data["type"])
                if data.get("class"):
                    place_types.append(data["class"])
                if not place_types:
                    place_types = ["place"]
                
                features = [
                    LocationFeature(
                        id=f"nominatim-{data.get('place_id', 'unknown')}",
                        place_name=data.get("display_name", f"{coordinates.lat}, {coordinates.lng}"),
                        text=data.get("name", data.get("display_name", "Unknown location")),
                        place_type=place_types,
                        coordinates=Coordinates(
                            lng=float(data["lon"]),
                            lat=float(data["lat"])
                        ),
                        relevance=1.0,
                        context=None
                    )
                ]
            
            logger.info(f"Nominatim reverse geocoding successful: {features[0].place_name}")
            
            query = f"{coordinates.lat},{coordinates.lng}"
            return LocationResponse(
                query=query,
                features=features,
                attribution="© OpenStreetMap contributors"
            )
            
        except httpx.HTTPError as e:
            logger.error(f"Nominatim reverse geocoding error: {e}")
            # Fallback: return coordinates
            features = [
                LocationFeature(
                    id="fallback",
                    place_name=f"{coordinates.lat:.4f}°, {coordinates.lng:.4f}°",
                    text="Location",
                    place_type=["coordinate"],
                    coordinates=coordinates,
                    relevance=1.0,
                    context=None
                )
            ]
            return LocationResponse(
                query=f"{coordinates.lat},{coordinates.lng}",
                features=features,
                attribution="© OpenStreetMap contributors"
            )
        except Exception as e:
            logger.error(f"Unexpected error in reverse geocoding: {e}")
            # Fallback
            features = [
                LocationFeature(
                    id="fallback",
                    place_name=f"{coordinates.lat:.4f}°, {coordinates.lng:.4f}°",
                    text="Location",
                    place_type=["coordinate"],
                    coordinates=coordinates,
                    relevance=1.0,
                    context=None
                )
            ]
            return LocationResponse(
                query=f"{coordinates.lat},{coordinates.lng}",
                features=features,
                attribution="© OpenStreetMap contributors"
            )
    
    def parse_coordinates(self, input_str: str) -> Optional[CoordinateParseResult]:
        """
        Parse coordinate string in various formats
        
        Args:
            input_str: Coordinate string to parse
        
        Returns:
            CoordinateParseResult if successful, None otherwise
        """
        return CoordinateParser.parse(input_str)

