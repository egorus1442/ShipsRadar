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
        
        This uses simplified oceanographic patterns:
        - Major ocean gyres
        - Western boundary currents (Gulf Stream, Kuroshio)
        - Equatorial currents
        - General circulation patterns
        """
        # Initialize with weak background current
        u_base = 0.0
        v_base = 0.0
        
        # Atlantic Ocean - Gulf Stream region (20-45°N, 80-40°W)
        if 20 <= lat <= 45 and -80 <= lng <= -40:
            # Strong northeastward current
            u_base = 0.5 + (lat - 20) * 0.03  # Eastward component
            v_base = 0.8 + (lat - 20) * 0.02  # Northward component
        
        # Pacific Ocean - Kuroshio Current (25-45°N, 130-160°E)
        elif 25 <= lat <= 45 and 130 <= lng <= 160:
            # Strong northeastward current
            u_base = 0.6
            v_base = 0.9
        
        # Equatorial regions (-5 to 5°) - Westward equatorial currents
        elif -5 <= lat <= 5:
            u_base = -0.4  # Westward
            v_base = 0.0
        
        # Southern Ocean (south of -40°) - Antarctic Circumpolar Current
        elif lat < -40:
            u_base = 0.8  # Strong eastward
            v_base = -0.1
        
        # North Atlantic Drift (45-60°N, 40-10°W)
        elif 45 <= lat <= 60 and -40 <= lng <= -10:
            u_base = 0.3
            v_base = 0.2
        
        # Add some variability based on time (simulate tidal influence)
        hour_factor = np.sin(timestamp.hour * np.pi / 12) * 0.1
        u = u_base + hour_factor
        v = v_base + hour_factor * 0.5
        
        # Add spatial variability (simulate eddies)
        spatial_factor = np.sin(lat * np.pi / 90) * np.cos(lng * np.pi / 180) * 0.05
        u += spatial_factor
        v -= spatial_factor * 0.5
        
        # Calculate speed and direction
        speed, direction = self._calculate_speed_and_direction(u, v)
        
        return CurrentData(
            u_component=u,
            v_component=v,
            speed=speed,
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

