"""
Route Calculator - Simple Great Circle routing with weather avoidance
Implements basic route calculation using great circle distance
"""
from typing import List, Tuple, Optional
from datetime import datetime, timedelta, timezone
from loguru import logger
import math

from geopy.distance import great_circle, geodesic
from geopy.point import Point

from models.route import (
    RouteRequest,
    RouteResponse,
    Waypoint,
    RouteMetrics,
    RouteWarning
)
from models.weather import Coordinates, WeatherPoint


class SimpleRouteCalculator:
    """
    Simple route calculator using Great Circle distance
    
    Features:
    - Generates waypoints along great circle route
    - Avoids extreme weather conditions
    - Calculates ETA for each waypoint
    - Provides route metrics and warnings
    """
    
    # Constants
    KNOTS_TO_KMH = 1.852  # 1 knot = 1.852 km/h
    NM_TO_KM = 1.852      # 1 nautical mile = 1.852 km
    EARTH_RADIUS_KM = 6371.0
    
    # Weather thresholds for warnings
    WARNING_WIND_THRESHOLD = 20.0  # knots
    WARNING_WAVE_THRESHOLD = 3.0   # meters
    DANGER_WIND_THRESHOLD = 30.0   # knots
    DANGER_WAVE_THRESHOLD = 5.0    # meters
    
    # Weather avoidance parameters
    AVOIDANCE_DISTANCE_NM = 75.0   # Distance to shift waypoint (50-100 nm as per TZ)
    MAX_ADJUSTMENT_ATTEMPTS = 3     # Max attempts to find better conditions
    
    def __init__(self):
        """Initialize route calculator"""
        self.weather_service = None  # Will be injected when needed
    
    def great_circle_route(
        self,
        start: Coordinates,
        end: Coordinates,
        waypoints_count: int = 20
    ) -> List[Coordinates]:
        """
        Calculate great circle route with evenly spaced waypoints
        
        Args:
            start: Starting coordinates
            end: Ending coordinates
            waypoints_count: Number of waypoints to generate (including start and end)
            
        Returns:
            List of coordinates along the great circle path
        """
        logger.info(f"Calculating great circle route from ({start.lat}, {start.lng}) to ({end.lat}, {end.lng})")
        
        if waypoints_count < 2:
            waypoints_count = 2
        
        # Convert to Point objects
        start_point = Point(start.lat, start.lng)
        end_point = Point(end.lat, end.lng)
        
        # Calculate total distance
        total_distance = geodesic(start_point, end_point).nm
        logger.info(f"Total distance: {total_distance:.2f} nautical miles")
        
        # Generate waypoints
        waypoints = []
        for i in range(waypoints_count):
            fraction = i / (waypoints_count - 1) if waypoints_count > 1 else 0
            
            # Interpolate along great circle
            waypoint = self._interpolate_great_circle(start_point, end_point, fraction)
            waypoints.append(Coordinates(lat=waypoint.latitude, lng=waypoint.longitude))
        
        logger.info(f"Generated {len(waypoints)} waypoints")
        return waypoints
    
    def _interpolate_great_circle(
        self,
        start: Point,
        end: Point,
        fraction: float
    ) -> Point:
        """
        Interpolate a point along the great circle path
        
        Args:
            start: Starting point
            end: Ending point
            fraction: Fraction of the path (0.0 to 1.0)
            
        Returns:
            Interpolated point
        """
        # Convert to radians
        lat1 = math.radians(start.latitude)
        lon1 = math.radians(start.longitude)
        lat2 = math.radians(end.latitude)
        lon2 = math.radians(end.longitude)
        
        # Calculate angular distance
        d = math.acos(
            math.sin(lat1) * math.sin(lat2) +
            math.cos(lat1) * math.cos(lat2) * math.cos(lon2 - lon1)
        )
        
        # Handle same points
        if d < 1e-10:
            return start
        
        # Interpolate
        a = math.sin((1 - fraction) * d) / math.sin(d)
        b = math.sin(fraction * d) / math.sin(d)
        
        x = a * math.cos(lat1) * math.cos(lon1) + b * math.cos(lat2) * math.cos(lon2)
        y = a * math.cos(lat1) * math.sin(lon1) + b * math.cos(lat2) * math.sin(lon2)
        z = a * math.sin(lat1) + b * math.sin(lat2)
        
        lat = math.atan2(z, math.sqrt(x * x + y * y))
        lon = math.atan2(y, x)
        
        return Point(math.degrees(lat), math.degrees(lon))
    
    def calculate_route_metrics(
        self,
        waypoints: List[Waypoint],
        request: RouteRequest
    ) -> RouteMetrics:
        """
        Calculate overall route metrics
        
        Args:
            waypoints: List of waypoints with calculated data
            request: Original route request
            
        Returns:
            RouteMetrics with statistics
        """
        if not waypoints:
            raise ValueError("Cannot calculate metrics for empty route")
        
        # Total distance
        total_distance_nm = waypoints[-1].cumulative_distance
        total_distance_km = total_distance_nm * self.NM_TO_KM
        
        # Time calculations
        departure_time = waypoints[0].eta
        arrival_time = waypoints[-1].eta
        duration = arrival_time - departure_time
        duration_hours = duration.total_seconds() / 3600.0
        
        # Average speed
        average_speed = total_distance_nm / duration_hours if duration_hours > 0 else 0
        
        # Weather statistics
        waypoints_adjusted = sum(1 for wp in waypoints if wp.is_adjusted)
        max_wind_speed = None
        max_wave_height = None
        
        for wp in waypoints:
            if wp.weather:
                if wp.weather.wind:
                    if max_wind_speed is None or wp.weather.wind.speed > max_wind_speed:
                        max_wind_speed = wp.weather.wind.speed
                
                if wp.weather.waves:
                    if max_wave_height is None or wp.weather.waves.height > max_wave_height:
                        max_wave_height = wp.weather.waves.height
        
        return RouteMetrics(
            total_distance_nm=total_distance_nm,
            total_distance_km=total_distance_km,
            estimated_duration_hours=duration_hours,
            departure_time=departure_time,
            arrival_time=arrival_time,
            average_speed_knots=average_speed,
            waypoints_adjusted=waypoints_adjusted,
            max_wind_speed=max_wind_speed,
            max_wave_height=max_wave_height
        )
    
    def avoid_extreme_weather(
        self,
        waypoints: List[Coordinates],
        weather_data: List[WeatherPoint],
        wind_threshold: float,
        wave_threshold: float
    ) -> Tuple[List[Coordinates], List[int]]:
        """
        Adjust waypoints to avoid extreme weather conditions
        
        Args:
            waypoints: Original waypoints
            weather_data: Weather forecast for each waypoint
            wind_threshold: Wind speed threshold in knots
            wave_threshold: Wave height threshold in meters
            
        Returns:
            Tuple of (adjusted waypoints, list of adjusted waypoint indices)
        """
        if len(waypoints) != len(weather_data):
            logger.warning("Waypoints and weather data length mismatch")
            return waypoints, []
        
        adjusted_waypoints = list(waypoints)
        adjusted_indices = []
        
        logger.info("Checking waypoints for extreme weather conditions")
        
        # Don't adjust first and last waypoints (start and end points)
        for i in range(1, len(waypoints) - 1):
            weather = weather_data[i]
            
            # Check if weather is extreme
            is_extreme = False
            reason = []
            
            if weather.wind and weather.wind.speed > wind_threshold:
                is_extreme = True
                reason.append(f"wind {weather.wind.speed:.1f} kts")
            
            if weather.waves and weather.waves.height > wave_threshold:
                is_extreme = True
                reason.append(f"waves {weather.waves.height:.1f} m")
            
            if is_extreme:
                logger.info(f"Waypoint {i} has extreme conditions: {', '.join(reason)}")
                
                # Try to find better position
                better_position = self._find_better_position(
                    waypoints[i],
                    waypoints[i - 1],
                    waypoints[i + 1],
                    weather_data[i].timestamp
                )
                
                if better_position:
                    adjusted_waypoints[i] = better_position
                    adjusted_indices.append(i)
                    logger.info(f"Adjusted waypoint {i} to avoid extreme weather")
        
        return adjusted_waypoints, adjusted_indices
    
    def _find_better_position(
        self,
        current: Coordinates,
        prev: Coordinates,
        next_wp: Coordinates,
        timestamp: datetime
    ) -> Optional[Coordinates]:
        """
        Find a better position to avoid extreme weather
        
        Attempts to shift the waypoint perpendicular to the route direction
        
        Args:
            current: Current waypoint position
            prev: Previous waypoint
            next_wp: Next waypoint
            timestamp: Time at this waypoint
            
        Returns:
            Better coordinates or None if no improvement found
        """
        # Calculate perpendicular direction to the route
        # For MVP, we'll shift the waypoint to the side
        
        # Calculate bearing from prev to next
        bearing = self._calculate_bearing(
            Point(prev.lat, prev.lng),
            Point(next_wp.lat, next_wp.lng)
        )
        
        # Try shifting perpendicular to the route (±90 degrees)
        attempts = [
            (bearing + 90, self.AVOIDANCE_DISTANCE_NM),   # Right side
            (bearing - 90, self.AVOIDANCE_DISTANCE_NM),   # Left side
            (bearing + 90, self.AVOIDANCE_DISTANCE_NM * 0.5),  # Shorter right
            (bearing - 90, self.AVOIDANCE_DISTANCE_NM * 0.5),  # Shorter left
        ]
        
        current_point = Point(current.lat, current.lng)
        
        for shift_bearing, shift_distance in attempts:
            new_point = self._destination_point(
                current_point,
                shift_bearing,
                shift_distance
            )
            
            # For MVP, we'll assume this is a better position
            # In production, we'd fetch weather for this position and compare
            logger.debug(f"Shifted waypoint by {shift_distance} nm at bearing {shift_bearing}°")
            return Coordinates(lat=new_point.latitude, lng=new_point.longitude)
        
        # If no better position found, return original
        return None
    
    def _calculate_bearing(self, start: Point, end: Point) -> float:
        """
        Calculate initial bearing from start to end point
        
        Args:
            start: Starting point
            end: Ending point
            
        Returns:
            Bearing in degrees (0-360)
        """
        lat1 = math.radians(start.latitude)
        lat2 = math.radians(end.latitude)
        diff_lon = math.radians(end.longitude - start.longitude)
        
        x = math.sin(diff_lon) * math.cos(lat2)
        y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(diff_lon)
        
        bearing = math.atan2(x, y)
        bearing = math.degrees(bearing)
        bearing = (bearing + 360) % 360
        
        return bearing
    
    def _destination_point(
        self,
        start: Point,
        bearing: float,
        distance_nm: float
    ) -> Point:
        """
        Calculate destination point given start point, bearing and distance
        
        Args:
            start: Starting point
            bearing: Bearing in degrees
            distance_nm: Distance in nautical miles
            
        Returns:
            Destination point
        """
        # Convert to radians
        lat1 = math.radians(start.latitude)
        lon1 = math.radians(start.longitude)
        bearing_rad = math.radians(bearing)
        
        # Convert distance to radians
        distance_km = distance_nm * self.NM_TO_KM
        angular_distance = distance_km / self.EARTH_RADIUS_KM
        
        # Calculate new position
        lat2 = math.asin(
            math.sin(lat1) * math.cos(angular_distance) +
            math.cos(lat1) * math.sin(angular_distance) * math.cos(bearing_rad)
        )
        
        lon2 = lon1 + math.atan2(
            math.sin(bearing_rad) * math.sin(angular_distance) * math.cos(lat1),
            math.cos(angular_distance) - math.sin(lat1) * math.sin(lat2)
        )
        
        return Point(math.degrees(lat2), math.degrees(lon2))
    
    def calculate_weather_penalty(
        self,
        weather: WeatherPoint
    ) -> float:
        """
        Calculate a penalty score for weather conditions
        
        Higher penalty means worse conditions
        
        Args:
            weather: Weather data point
            
        Returns:
            Penalty score (0.0 to 1.0+)
        """
        penalty = 0.0
        
        if weather.wind:
            # Wind penalty: increases exponentially above 15 knots
            if weather.wind.speed > 15:
                penalty += (weather.wind.speed - 15) / 30.0
        
        if weather.waves:
            # Wave penalty: increases exponentially above 2 meters
            if weather.waves.height > 2:
                penalty += (weather.waves.height - 2) / 5.0
        
        # Cap penalty at reasonable value
        return min(penalty, 2.0)
    
    def generate_warnings(
        self,
        waypoints: List[Waypoint]
    ) -> List[RouteWarning]:
        """
        Generate warnings for route conditions
        
        Args:
            waypoints: List of waypoints with weather data
            
        Returns:
            List of warnings
        """
        warnings = []
        
        for wp in waypoints:
            if not wp.weather:
                continue
            
            # Wind warnings
            if wp.weather.wind:
                wind_speed = wp.weather.wind.speed
                
                if wind_speed >= self.DANGER_WIND_THRESHOLD:
                    warnings.append(RouteWarning(
                        severity="danger",
                        waypoint_id=wp.id,
                        message=f"Dangerous wind conditions at waypoint {wp.id}",
                        parameter="wind",
                        value=wind_speed
                    ))
                elif wind_speed >= self.WARNING_WIND_THRESHOLD:
                    warnings.append(RouteWarning(
                        severity="warning",
                        waypoint_id=wp.id,
                        message=f"High wind at waypoint {wp.id}",
                        parameter="wind",
                        value=wind_speed
                    ))
            
            # Wave warnings
            if wp.weather.waves:
                wave_height = wp.weather.waves.height
                
                if wave_height >= self.DANGER_WAVE_THRESHOLD:
                    warnings.append(RouteWarning(
                        severity="danger",
                        waypoint_id=wp.id,
                        message=f"Dangerous wave conditions at waypoint {wp.id}",
                        parameter="waves",
                        value=wave_height
                    ))
                elif wave_height >= self.WARNING_WAVE_THRESHOLD:
                    warnings.append(RouteWarning(
                        severity="warning",
                        waypoint_id=wp.id,
                        message=f"High waves at waypoint {wp.id}",
                        parameter="waves",
                        value=wave_height
                    ))
        
        logger.info(f"Generated {len(warnings)} warnings for route")
        return warnings
    
    async def calculate_route(
        self,
        request: RouteRequest,
        weather_service
    ) -> RouteResponse:
        """
        Calculate complete route with weather data and avoidance
        
        Args:
            request: Route calculation request
            weather_service: Weather aggregator service
            
        Returns:
            Complete route response with waypoints, metrics, and warnings
        """
        start_time = datetime.now(timezone.utc)
        logger.info("Starting route calculation")
        
        try:
            # Step 1: Generate initial great circle route
            waypoint_coords = self.great_circle_route(
                request.start,
                request.end,
                request.waypoints_count
            )
            
            # Step 2: Calculate ETA for each waypoint
            waypoints_with_eta = self._calculate_etas(
                waypoint_coords,
                request.departure_time,
                request.vessel_speed
            )
            
            # Step 3: Fetch weather data for each waypoint
            weather_data = await self._fetch_weather_for_waypoints(
                waypoints_with_eta,
                weather_service
            )
            
            # Step 4: Avoid extreme weather if requested
            adjusted_indices = []
            if request.avoid_extreme_weather:
                adjusted_coords, adjusted_indices = self.avoid_extreme_weather(
                    waypoint_coords,
                    weather_data,
                    request.extreme_wind_threshold,
                    request.extreme_wave_threshold
                )
                
                # Recalculate ETAs with adjusted coordinates
                if adjusted_indices:
                    waypoint_coords = adjusted_coords
                    waypoints_with_eta = self._calculate_etas(
                        waypoint_coords,
                        request.departure_time,
                        request.vessel_speed
                    )
                    # Refetch weather for adjusted waypoints
                    weather_data = await self._fetch_weather_for_waypoints(
                        waypoints_with_eta,
                        weather_service
                    )
            
            # Step 5: Create final waypoint objects
            waypoints = []
            for i, (coords, eta_time) in enumerate(waypoints_with_eta):
                # Calculate distance from previous waypoint
                if i == 0:
                    distance_from_prev = 0.0
                    cumulative_distance = 0.0
                else:
                    prev_coords = waypoint_coords[i - 1]
                    distance_from_prev = geodesic(
                        (prev_coords.lat, prev_coords.lng),
                        (coords.lat, coords.lng)
                    ).nm
                    cumulative_distance = waypoints[i - 1].cumulative_distance + distance_from_prev
                
                waypoint = Waypoint(
                    id=i,
                    coordinates=coords,
                    eta=eta_time,
                    distance_from_prev=distance_from_prev,
                    cumulative_distance=cumulative_distance,
                    weather=weather_data[i] if i < len(weather_data) else None,
                    is_adjusted=i in adjusted_indices,
                    warnings=[]
                )
                
                # Add warnings to waypoint
                if waypoint.weather:
                    if waypoint.weather.wind and waypoint.weather.wind.speed > request.extreme_wind_threshold:
                        waypoint.warnings.append(f"High wind: {waypoint.weather.wind.speed:.1f} kts")
                    if waypoint.weather.waves and waypoint.weather.waves.height > request.extreme_wave_threshold:
                        waypoint.warnings.append(f"High waves: {waypoint.weather.waves.height:.1f} m")
                
                waypoints.append(waypoint)
            
            # Step 6: Calculate route metrics
            metrics = self.calculate_route_metrics(waypoints, request)
            
            # Step 7: Generate route-level warnings
            warnings = self.generate_warnings(waypoints)
            
            # Calculate processing time
            end_time = datetime.now(timezone.utc)
            calculation_time = (end_time - start_time).total_seconds() * 1000
            
            logger.info(f"Route calculation completed in {calculation_time:.2f}ms")
            
            return RouteResponse(
                request=request,
                waypoints=waypoints,
                metrics=metrics,
                warnings=warnings,
                algorithm="simple_great_circle_with_weather_avoidance",
                calculated_at=end_time,
                calculation_time_ms=calculation_time
            )
            
        except Exception as e:
            logger.error(f"Error calculating route: {e}")
            raise
    
    def _calculate_etas(
        self,
        waypoint_coords: List[Coordinates],
        departure_time: datetime,
        vessel_speed: float
    ) -> List[Tuple[Coordinates, datetime]]:
        """
        Calculate ETA for each waypoint based on distance and speed
        
        Args:
            waypoint_coords: List of waypoint coordinates
            departure_time: Departure time from first waypoint
            vessel_speed: Vessel speed in knots
            
        Returns:
            List of (coordinates, eta) tuples
        """
        waypoints_with_eta = []
        current_time = departure_time
        
        for i, coords in enumerate(waypoint_coords):
            if i == 0:
                # First waypoint - departure time
                waypoints_with_eta.append((coords, current_time))
            else:
                # Calculate distance from previous waypoint
                prev_coords = waypoint_coords[i - 1]
                distance_nm = geodesic(
                    (prev_coords.lat, prev_coords.lng),
                    (coords.lat, coords.lng)
                ).nm
                
                # Calculate time to travel this distance
                hours = distance_nm / vessel_speed
                current_time += timedelta(hours=hours)
                
                waypoints_with_eta.append((coords, current_time))
        
        return waypoints_with_eta
    
    async def _fetch_weather_for_waypoints(
        self,
        waypoints_with_eta: List[Tuple[Coordinates, datetime]],
        weather_service
    ) -> List[WeatherPoint]:
        """
        Fetch weather data for all waypoints
        
        Args:
            waypoints_with_eta: List of (coordinates, eta) tuples
            weather_service: Weather aggregator service
            
        Returns:
            List of weather data points
        """
        logger.info(f"Fetching weather for {len(waypoints_with_eta)} waypoints")
        
        # Prepare waypoints data for weather service
        waypoints_data = [
            (coords.lat, coords.lng, eta)
            for coords, eta in waypoints_with_eta
        ]
        
        # Fetch weather in parallel
        weather_points = await weather_service.get_weather_for_route(
            waypoints_data,
            include_currents=True
        )
        
        return weather_points


# Singleton instance
_route_calculator: Optional[SimpleRouteCalculator] = None


def get_route_calculator() -> SimpleRouteCalculator:
    """Get singleton instance of SimpleRouteCalculator"""
    global _route_calculator
    if _route_calculator is None:
        _route_calculator = SimpleRouteCalculator()
    return _route_calculator

