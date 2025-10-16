"""
Application configuration
Loads environment variables and provides settings for the application
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Keys
    mapbox_api_key: str = ""
    
    # Application
    environment: str = "development"
    debug: bool = True
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080"
    ]
    
    # API metadata
    app_name: str = "ShipsRadar API"
    app_version: str = "1.0.0"
    app_description: str = "API for optimizing ship routes with weather data"
    
    # External APIs (optional)
    copernicus_username: str = ""
    copernicus_password: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

