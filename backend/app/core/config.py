from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "RogMitra"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "demo-secret-key-change-in-production-rogmitra-btech"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Feature Flags / Paths
    DATABASE_URL: str = "sqlite:///./rogmitra.db"
    DEMO_MODE: bool = True
    DEMO_OTP: str = "123456"
    DEMO_LOGIN_OPEN: bool = True

    # LLM Provider Configuration (gemini | ollama | none)
    LLM_PROVIDER: str = "none"
    GEMINI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=[".env", "backend/.env"],
        extra="allow"
    )

settings = Settings()
