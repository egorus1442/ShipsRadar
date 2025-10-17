"""
NOAA RTOFS Ocean Currents Integration
Real-Time Ocean Forecast System (RTOFS) for ocean current data
"""
import httpx
from typing import Optional, List
from datetime import datetime, timedelta
from loguru import logger
import numpy as np

from models.weather import CurrentData, NOAACurrentsPoint, Coordinates


class OceanCurrentsService:
    """Service for fetching ocean current data from NOAA RTOFS"""
    
    # NOAA RTOFS OPeNDAP endpoints
    # Note: These are example endpoints - actual implementation may require authentication
    RTOFS_BASE_URL = "https://nomads.ncep.noaa.gov/dods/rtofs"
    
    # Fallback: Use a simplified mock service for MVP
    # In production, this would connect to actual NOAA/Copernicus servers
    USE_MOCK_DATA = True  # Set to False when real credentials are available
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    def _convert_mps_to_knots(self, speed_mps: float) -> float:
        """Convert m/s to knots"""
        return speed_mps * 1.94384
    
    def _calculate_speed_and_direction(self, u: float, v: float) -> tuple[float, float]:
        """
        Calculate speed and direction from u,v components
        
        Args:
            u: U component (east-west) in m/s
            v: V component (north-south) in m/s
            
        Returns:
            Tuple of (speed in knots, direction in degrees)
        """
        # Calculate speed (magnitude)
        speed_mps = np.sqrt(u**2 + v**2)
        speed_knots = self._convert_mps_to_knots(speed_mps)
        
        # Calculate direction (oceanographic convention: direction TO)
        # Convert from math convention (CCW from east) to navigation (CW from north)
        direction_rad = np.arctan2(v, u)
        direction_deg = (90 - np.degrees(direction_rad)) % 360
        
        return speed_knots, direction_deg
    
    async def fetch_currents(
        self,
        lat: float,
        lng: float,
        timestamp: Optional[datetime] = None
    ) -> Optional[CurrentData]:
        """
        Fetch ocean current data for a specific point and time
        
        Args:
            lat: Latitude (-90 to 90)
            lng: Longitude (-180 to 180)
            timestamp: Time for the data (default: now)
            
        Returns:
            CurrentData or None if not available
        """
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        logger.info(f"Fetching ocean currents for ({lat}, {lng}) at {timestamp}")
        
        try:
            if self.USE_MOCK_DATA:
                # Use mock data for MVP (based on typical ocean patterns)
                return self._generate_mock_currents(lat, lng, timestamp)
            else:
                # Real NOAA RTOFS data (requires credentials and netCDF processing)
                return await self._fetch_rtofs_currents(lat, lng, timestamp)
                
        except Exception as e:
            logger.error(f"Error fetching ocean currents: {e}")
            # Return None rather than failing - currents are optional
            return None
    
    def _generate_mock_currents(
        self,
        lat: float,
        lng: float,
        timestamp: datetime
    ) -> CurrentData:
        """
        Generate realistic mock current data based on location
        
        This uses comprehensive oceanographic patterns:
        - Major ocean gyres (North/South Atlantic, Pacific, Indian Ocean)
        - Western boundary currents (Gulf Stream, Kuroshio, Agulhas, Brazil)
        - Eastern boundary currents (California, Canary, Benguela, Peru)
        - Equatorial current systems
        - Antarctic Circumpolar Current
        - Regional circulation patterns
        """
        abs_lat = abs(lat)
        
        # Initialize with weak background current
        u_base = 0.0
        v_base = 0.0
        
        # === ATLANTIC OCEAN ===
        if -70 <= lng <= 20:
            # Gulf Stream (20-45°N, 80-40°W)
            if 20 <= lat <= 45 and -80 <= lng <= -40:
                # Strong northeastward current (one of strongest currents)
                u_base = 0.8 + (lat - 20) * 0.04  # Eastward component increases
                v_base = 1.0 + (lat - 20) * 0.03  # Northward component
            
            # North Atlantic Drift (45-65°N, 40-10°W)
            elif 45 <= lat <= 65 and -40 <= lng <= -10:
                u_base = 0.4 + (lat - 45) * 0.01  # Eastward
                v_base = 0.3 + (lat - 45) * 0.02  # Northward
            
            # Canary Current (20-35°N, 25-10°W) - southward eastern boundary
            elif 20 <= lat <= 35 and -25 <= lng <= -10:
                u_base = -0.2  # Slight westward
                v_base = -0.4  # Southward
            
            # North Equatorial Current (10-20°N) - westward
            elif 10 <= lat <= 20:
                u_base = -0.5 - (lat - 10) * 0.02
                v_base = 0.0
            
            # Equatorial Counter Current (3-10°N) - eastward
            elif 3 <= lat <= 10:
                u_base = 0.4
                v_base = 0.0
            
            # South Equatorial Current (-5 to 3°N) - westward
            elif -5 <= lat <= 3:
                u_base = -0.6
                v_base = 0.0
            
            # Brazil Current (-40 to -5°S, 50-35°W) - southward western boundary
            elif -40 <= lat <= -5 and -50 <= lng <= -35:
                u_base = 0.2
                v_base = -0.6 + (lat + 20) * 0.02
            
            # Benguela Current (-35 to -15°S, 15-5°E) - northward eastern boundary
            elif -35 <= lat <= -15 and 5 <= lng <= 20:
                u_base = -0.1
                v_base = 0.4
            
            # South Atlantic Gyre (-40 to -15°S)
            elif -40 <= lat <= -15:
                u_base = -0.3
                v_base = 0.1
        
        # === PACIFIC OCEAN ===
        elif (lng >= 120) or (lng <= -100):
            # Kuroshio Current (25-45°N, 130-160°E) - northeastward western boundary
            if 25 <= lat <= 45 and 130 <= lng <= 160:
                u_base = 0.9 + (lat - 25) * 0.03
                v_base = 1.1 + (lat - 25) * 0.02
            
            # North Pacific Current (40-55°N, 160°E-140°W)
            elif 40 <= lat <= 55 and ((lng >= 160) or (lng <= -140)):
                u_base = 0.5
                v_base = 0.2
            
            # California Current (25-45°N, 130-110°W) - southward eastern boundary
            elif 25 <= lat <= 45 and -130 <= lng <= -110:
                u_base = -0.1
                v_base = -0.5
            
            # North Equatorial Current (10-20°N) - westward
            elif 10 <= lat <= 20:
                u_base = -0.6
                v_base = 0.0
            
            # Equatorial Counter Current (3-10°N) - eastward
            elif 3 <= lat <= 10:
                u_base = 0.5
                v_base = 0.0
            
            # South Equatorial Current (-10 to 3°N) - westward
            elif -10 <= lat <= 3:
                u_base = -0.7
                v_base = 0.0
            
            # East Australian Current (-40 to -15°S, 150-160°E) - southward
            elif -40 <= lat <= -15 and 150 <= lng <= 160:
                u_base = 0.3
                v_base = -0.7
            
            # Peru (Humboldt) Current (-40 to -5°S, 90-70°W) - northward eastern boundary
            elif -40 <= lat <= -5 and -90 <= lng <= -70:
                u_base = -0.2
                v_base = 0.6 + (lat + 20) * 0.02
        
        # === INDIAN OCEAN ===
        elif 20 <= lng <= 120:
            # Agulhas Current (-40 to -25°S, 25-40°E) - southward western boundary
            if -40 <= lat <= -25 and 25 <= lng <= 40:
                u_base = 0.4
                v_base = -1.0  # Very strong southward
            
            # Somali Current (0-12°N, 45-55°E) - monsoon influenced
            elif 0 <= lat <= 12 and 45 <= lng <= 55:
                # Varies with season - simplified
                seasonal_factor = np.sin(timestamp.month * np.pi / 6)
                u_base = 0.2
                v_base = 0.6 * seasonal_factor
            
            # South Equatorial Current (-15 to 0°, 50-100°E) - westward
            elif -15 <= lat <= 0:
                u_base = -0.5
                v_base = 0.0
            
            # North Equatorial Current (8-15°N) - westward
            elif 8 <= lat <= 15:
                u_base = -0.4
                v_base = 0.0
            
            # Equatorial Counter Current (3-8°N) - eastward
            elif 3 <= lat <= 8:
                u_base = 0.4
                v_base = 0.0
        
        # === SOUTHERN OCEAN (Antarctic Circumpolar Current) ===
        if lat < -45:
            # Strongest current on Earth - flows eastward around Antarctica
            u_base = 1.2 + (abs(lat) - 45) * 0.05
            v_base = -0.1 - (abs(lat) - 45) * 0.01
        
        # === ARCTIC OCEAN ===
        elif lat > 70:
            # Complex circulation, simplified as weak cyclonic
            u_base = 0.1 * np.sin(lng * np.pi / 180)
            v_base = 0.1 * np.cos(lng * np.pi / 180)
        
        # Add temporal variability (tidal influence, eddies)
        hour_factor = np.sin(timestamp.hour * np.pi / 12) * 0.15
        day_factor = np.sin(timestamp.day * np.pi / 15) * 0.1
        
        u = u_base + hour_factor + day_factor
        v = v_base + hour_factor * 0.7 + day_factor * 0.5
        
        # Add spatial variability (mesoscale eddies)
        eddy_u = np.sin(lat * np.pi / 30) * np.cos(lng * np.pi / 45) * 0.08
        eddy_v = np.cos(lat * np.pi / 30) * np.sin(lng * np.pi / 45) * 0.08
        
        u += eddy_u
        v += eddy_v
        
        # Add random small-scale variability
        import random
        u += random.uniform(-0.05, 0.05)
        v += random.uniform(-0.05, 0.05)
        
        # Calculate speed and direction
        speed, direction = self._calculate_speed_and_direction(u, v)
        
        # Ensure direction is [0, 360)
        direction = round(direction, 1)
        if direction >= 360.0:
            direction = 0.0
        
        return CurrentData(
            u_component=round(u, 3),
            v_component=round(v, 3),
            speed=round(speed, 2),
            direction=direction
        )
    
    async def _fetch_rtofs_currents(
        self,
        lat: float,
        lng: float,
        timestamp: datetime
    ) -> Optional[CurrentData]:
        """
        Fetch real ocean current data from NOAA RTOFS
        
        This requires:
        - xarray and netCDF4 libraries
        - OPeNDAP server access
        - Potentially authentication credentials
        
        For production implementation, uncomment and configure:
        """
        # TODO: Implement real NOAA RTOFS integration when credentials available
        # 
        # import xarray as xr
        # 
        # # Construct OPeNDAP URL
        # date_str = timestamp.strftime('%Y%m%d')
        # url = f"{self.RTOFS_BASE_URL}/rtofs_global{date_str}/rtofs_glo_2ds_forecast_daily_prog"
        # 
        # # Open dataset
        # ds = xr.open_dataset(url)
        # 
        # # Extract u,v components at the location
        # u = ds['u'].sel(lat=lat, lon=lng, method='nearest')
        # v = ds['v'].sel(lat=lat, lon=lng, method='nearest')
        # 
        # # Calculate speed and direction
        # speed, direction = self._calculate_speed_and_direction(u.values, v.values)
        # 
        # return CurrentData(
        #     u_component=float(u.values),
        #     v_component=float(v.values),
        #     speed=speed,
        #     direction=direction
        # )
        
        logger.warning("Real NOAA RTOFS integration not configured, using mock data")
        return self._generate_mock_currents(lat, lng, timestamp)
    
    async def fetch_currents_grid(
        self,
        bbox: List[float],
        timestamp: Optional[datetime] = None,
        resolution: float = 1.0
    ) -> List[NOAACurrentsPoint]:
        """
        Fetch ocean currents for a grid of points (for visualization)
        
        Args:
            bbox: Bounding box [west, south, east, north]
            timestamp: Time for the data
            resolution: Grid resolution in degrees (default: 1.0)
            
        Returns:
            List of NOAACurrentsPoint objects
        """
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        west, south, east, north = bbox
        
        # Generate grid points
        lats = np.arange(south, north, resolution)
        lngs = np.arange(west, east, resolution)
        
        points = []
        for lat in lats:
            for lng in lngs:
                try:
                    current_data = await self.fetch_currents(lat, lng, timestamp)
                    if current_data:
                        point = NOAACurrentsPoint(
                            lat=lat,
                            lng=lng,
                            timestamp=timestamp,
                            u=current_data.u_component,
                            v=current_data.v_component
                        )
                        points.append(point)
                except Exception as e:
                    logger.warning(f"Error fetching currents at ({lat}, {lng}): {e}")
                    continue
        
        logger.info(f"Fetched {len(points)} current data points for grid")
        return points


# Singleton instance
_ocean_currents_service: Optional[OceanCurrentsService] = None


def get_ocean_currents_service() -> OceanCurrentsService:
    """Get singleton instance of OceanCurrentsService"""
    global _ocean_currents_service
    if _ocean_currents_service is None:
        _ocean_currents_service = OceanCurrentsService()
    return _ocean_currents_service

