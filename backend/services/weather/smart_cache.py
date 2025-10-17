"""
Smart Weather Cache with Rolling Window
Optimized caching strategy for weather data with automatic cleanup
"""
from typing import Dict, List, Optional, Tuple, Set
from datetime import datetime, date, timedelta
from loguru import logger
import sys

from models.weather import WeatherPoint


class CacheStats:
    """Statistics for cache monitoring"""
    
    def __init__(self):
        self.hits: int = 0
        self.misses: int = 0
        self.total_requests: int = 0
        self.days_cached: int = 0
        self.points_cached: int = 0
        self.api_requests_saved: int = 0
    
    def hit(self):
        """Record cache hit"""
        self.hits += 1
        self.total_requests += 1
        self.api_requests_saved += 1
    
    def miss(self):
        """Record cache miss"""
        self.misses += 1
        self.total_requests += 1
    
    @property
    def hit_rate(self) -> float:
        """Calculate hit rate percentage"""
        if self.total_requests == 0:
            return 0.0
        return (self.hits / self.total_requests) * 100
    
    def to_dict(self) -> dict:
        """Convert stats to dictionary"""
        return {
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": self.total_requests,
            "hit_rate": round(self.hit_rate, 2),
            "days_cached": self.days_cached,
            "points_cached": self.points_cached,
            "api_requests_saved": self.api_requests_saved
        }


class SmartWeatherCache:
    """
    Intelligent weather cache with day-based structure and automatic cleanup
    
    Features:
    - Stores data by date for efficient lookup
    - Automatically removes expired days
    - Tracks cache statistics
    - Rolling window of forecast days
    """
    
    def __init__(self, max_days_ahead: int = 7):
        """
        Initialize smart cache
        
        Args:
            max_days_ahead: Maximum days ahead to cache (default: 7)
        """
        # Cache structure: {date: {(lat, lng): [WeatherPoint, ...]}}
        self._cache: Dict[date, Dict[Tuple[float, float], List[WeatherPoint]]] = {}
        self._max_days_ahead = max_days_ahead
        self._last_cleanup = datetime.utcnow()
        self._stats = CacheStats()
        
        logger.info(f"✨ SmartWeatherCache initialized (max_days_ahead={max_days_ahead})")
    
    def get(
        self,
        lat: float,
        lng: float,
        timestamp: datetime
    ) -> Optional[List[WeatherPoint]]:
        """
        Get cached weather data for coordinates and timestamp
        
        Args:
            lat: Latitude
            lng: Longitude
            timestamp: Requested timestamp
            
        Returns:
            List of WeatherPoint if cached, None otherwise
        """
        target_date = timestamp.date()
        
        # Check if date is valid
        if not self._is_date_valid(target_date):
            self._stats.miss()
            return None
        
        # Check if date is in cache
        if target_date not in self._cache:
            self._stats.miss()
            logger.debug(f"❌ Cache MISS: {target_date} not in cache")
            return None
        
        # Check if coordinates are in cache for this date
        coord_key = self._make_coord_key(lat, lng)
        day_cache = self._cache[target_date]
        
        if coord_key not in day_cache:
            self._stats.miss()
            logger.debug(f"❌ Cache MISS: ({lat:.2f}, {lng:.2f}) not in cache for {target_date}")
            return None
        
        # Cache hit!
        self._stats.hit()
        logger.debug(f"✅ Cache HIT: ({lat:.2f}, {lng:.2f}) for {target_date}")
        
        return day_cache[coord_key]
    
    def get_day_data(
        self,
        target_date: date,
        coordinates: List[Tuple[float, float]]
    ) -> Dict[Tuple[float, float], List[WeatherPoint]]:
        """
        Get all cached data for a specific day and set of coordinates
        
        Args:
            target_date: Date to retrieve
            coordinates: List of (lat, lng) tuples
            
        Returns:
            Dictionary mapping coordinates to weather points
        """
        if target_date not in self._cache:
            return {}
        
        day_cache = self._cache[target_date]
        result = {}
        
        for coord in coordinates:
            coord_key = self._make_coord_key(coord[0], coord[1])
            if coord_key in day_cache:
                result[coord] = day_cache[coord_key]
                self._stats.hit()
            else:
                self._stats.miss()
        
        return result
    
    def set(
        self,
        lat: float,
        lng: float,
        weather_points: List[WeatherPoint]
    ):
        """
        Store weather data in cache and trigger cleanup if needed
        
        Args:
            lat: Latitude
            lng: Longitude
            weather_points: List of weather points to cache
        """
        if not weather_points:
            return
        
        # Group weather points by date
        points_by_date: Dict[date, List[WeatherPoint]] = {}
        for point in weather_points:
            point_date = point.timestamp.date()
            if point_date not in points_by_date:
                points_by_date[point_date] = []
            points_by_date[point_date].append(point)
        
        # Store each day's data
        coord_key = self._make_coord_key(lat, lng)
        
        for point_date, points in points_by_date.items():
            # Check if date is valid
            if not self._is_date_valid(point_date):
                continue
            
            # Ensure date exists in cache
            if point_date not in self._cache:
                self._cache[point_date] = {}
            
            # Store points for this coordinate
            self._cache[point_date][coord_key] = points
            
        logger.debug(
            f"💾 Cached {len(weather_points)} points for ({lat:.2f}, {lng:.2f}) "
            f"across {len(points_by_date)} days"
        )
        
        # Trigger cleanup if it's been more than 1 hour
        if datetime.utcnow() - self._last_cleanup > timedelta(hours=1):
            self._cleanup_old_days()
    
    def set_multi_day(
        self,
        batch_results: Dict[Tuple[float, float], List[WeatherPoint]]
    ):
        """
        Store batch results efficiently
        
        Args:
            batch_results: Dictionary mapping (lat, lng) to list of weather points
        """
        for coord, weather_points in batch_results.items():
            lat, lng = coord
            self.set(lat, lng, weather_points)
    
    def _cleanup_old_days(self):
        """
        Remove data for expired days (before today)
        """
        today = date.today()
        expired_dates = [d for d in self._cache.keys() if d < today]
        
        if not expired_dates:
            logger.debug("🧹 Cleanup: No expired days to remove")
            self._last_cleanup = datetime.utcnow()
            return
        
        # Remove expired dates
        for expired_date in expired_dates:
            del self._cache[expired_date]
        
        logger.info(
            f"🗑️ Cleanup: Removed {len(expired_dates)} expired days: "
            f"{min(expired_dates)} to {max(expired_dates)}"
        )
        
        self._last_cleanup = datetime.utcnow()
    
    def _is_date_valid(self, target_date: date) -> bool:
        """
        Check if date is within valid caching window
        
        Args:
            target_date: Date to validate
            
        Returns:
            True if date is within [today, today + max_days_ahead]
        """
        today = date.today()
        max_date = today + timedelta(days=self._max_days_ahead)
        
        return today <= target_date <= max_date
    
    def _make_coord_key(self, lat: float, lng: float) -> Tuple[float, float]:
        """
        Create coordinate key with rounding for cache efficiency
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Tuple of rounded coordinates
        """
        # Round to 4 decimal places (~11m precision)
        return (round(lat, 4), round(lng, 4))
    
    def get_stats(self) -> dict:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache statistics
        """
        # Update counts
        self._stats.days_cached = len(self._cache)
        self._stats.points_cached = sum(
            len(coords) for day_cache in self._cache.values()
            for coords in day_cache.values()
        )
        
        stats_dict = self._stats.to_dict()
        
        # Add cache details
        cache_dates = sorted(self._cache.keys())
        stats_dict["cache_range"] = {
            "start": cache_dates[0].isoformat() if cache_dates else None,
            "end": cache_dates[-1].isoformat() if cache_dates else None
        }
        
        # Calculate memory usage estimate (rough)
        memory_mb = self._estimate_memory_usage()
        stats_dict["memory_mb"] = round(memory_mb, 2)
        
        return stats_dict
    
    def _estimate_memory_usage(self) -> float:
        """
        Estimate cache memory usage in MB
        
        Returns:
            Estimated memory in megabytes
        """
        # Rough estimate: each WeatherPoint ~ 500 bytes
        total_points = sum(
            len(points)
            for day_cache in self._cache.values()
            for points in day_cache.values()
        )
        
        bytes_estimate = total_points * 500
        return bytes_estimate / (1024 * 1024)
    
    def clear(self):
        """Clear all cached data"""
        self._cache.clear()
        logger.info("🧹 Cache cleared completely")
    
    def force_cleanup(self):
        """Force immediate cleanup of old days"""
        self._cleanup_old_days()
    
    def get_cached_dates(self) -> List[date]:
        """Get list of dates currently in cache"""
        return sorted(self._cache.keys())
    
    def get_cached_coordinates_for_date(self, target_date: date) -> List[Tuple[float, float]]:
        """
        Get all cached coordinates for a specific date
        
        Args:
            target_date: Date to query
            
        Returns:
            List of (lat, lng) tuples
        """
        if target_date not in self._cache:
            return []
        
        return list(self._cache[target_date].keys())

