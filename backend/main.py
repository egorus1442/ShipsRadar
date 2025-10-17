"""
ShipsRadar Backend - Main Application Entry Point
FastAPI application for ship route optimization with weather data
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys
import asyncio
from contextlib import asynccontextmanager

from config import settings

# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="DEBUG" if settings.debug else "INFO"
)


# Background task for cache cleanup
async def cache_cleanup_task():
    """
    Background task to periodically cleanup weather cache
    Runs every hour to remove expired data
    """
    from services.weather.aggregator import get_weather_aggregator
    
    logger.info("🧹 Cache cleanup task started")
    
    while True:
        try:
            await asyncio.sleep(3600)  # Run every hour
            
            aggregator = get_weather_aggregator()
            if aggregator.smart_cache:
                aggregator.force_cache_cleanup()
                
                # Log cache stats after cleanup
                stats = aggregator.get_cache_stats()
                logger.info(
                    f"📊 Cache stats after cleanup: "
                    f"{stats.get('days_cached', 0)} days, "
                    f"{stats.get('points_cached', 0)} points, "
                    f"hit rate: {stats.get('hit_rate', 0):.1f}%"
                )
        except Exception as e:
            logger.error(f"❌ Error in cache cleanup task: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"CORS origins: {settings.cors_origins}")
    
    # Start background task for cache cleanup
    cleanup_task = asyncio.create_task(cache_cleanup_task())
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        logger.info("🧹 Cache cleanup task cancelled")


# Initialize FastAPI application with lifespan
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - health check"""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "environment": settings.environment
    }


@app.get("/health", tags=["Root"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.app_version
    }


# Import and include routers
from api import location, weather, route

app.include_router(location.router, prefix="/api", tags=["Location"])
app.include_router(weather.router, prefix="/api", tags=["Weather"])
app.include_router(route.router, prefix="/api", tags=["Route"])


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting server on {settings.api_host}:{settings.api_port}")
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )

