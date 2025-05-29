import os
import secrets
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    # CORS配置
    CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost:3000", "http://localhost:5173"]

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    PROJECT_NAME: str = "审核处理线上咨询平台"
    BASE_DIR: str = os.path.dirname(os.path.abspath(__file__))
    
    # 数据库配置
    DATABASE_TYPE: str = "sqlsite"  # sqlite, sqlserver 或 oracle
    
    # SQLite配置
    @property
    def SQLITE_DATABASE_URI(self) -> str:
        db_path = os.path.join(self.BASE_DIR, "database", "app.db")
        return f"sqlite:///{db_path}"
    
    # SQL Server配置
    DB_SERVER: Optional[str] = "localhost"
    DB_DATABASE: Optional[str] = "test_base"
    DB_USERNAME: Optional[str] = "zhuo"
    DB_PASSWORD: Optional[str] = "123456"
    DB_PORT: Optional[str] = "1433"
    DB_DRIVER: Optional[str] = "ODBC Driver 17 for SQL Server"
    
    # Oracle配置
    ORACLE_USER: Optional[str] = None
    ORACLE_PASSWORD: Optional[str] = None
    ORACLE_HOST: Optional[str] = "localhost"
    ORACLE_PORT: Optional[str] = "1521"
    ORACLE_SERVICE: Optional[str] = None
    
    # 数据库引擎配置
    DB_ECHO: bool = False  # 是否打印SQL语句
    DB_POOL_PRE_PING: bool = True  # 连接池预检测
    DB_POOL_RECYCLE: int = 300  # 连接池回收时间
    
    # 搜索索引配置
    @property
    def SEARCH_INDEX_DIR(self) -> str:
        index_dir = os.path.join(self.BASE_DIR, "database", "search_index")
        if not os.path.exists(index_dir):
            os.makedirs(index_dir, exist_ok=True)
        return index_dir
    
    # 开发环境配置
    DEBUG: Optional[str] = "false"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_TYPE == "sqlserver" and all([self.DB_SERVER, self.DB_DATABASE, self.DB_USERNAME]):
            driver = self.DB_DRIVER.replace(' ', '+') if self.DB_DRIVER else 'ODBC+Driver+17+for+SQL+Server'
            return f"mssql+pyodbc://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_SERVER}:{self.DB_PORT}/{self.DB_DATABASE}?driver={driver}"
        elif self.DATABASE_TYPE == "oracle" and all([self.ORACLE_USER, self.ORACLE_PASSWORD, self.ORACLE_SERVICE]):
            return f"oracle+cx_oracle://{self.ORACLE_USER}:{self.ORACLE_PASSWORD}@{self.ORACLE_HOST}:{self.ORACLE_PORT}/?service_name={self.ORACLE_SERVICE}"
        return self.SQLITE_DATABASE_URI
    
    # Casbin配置
    CASBIN_MODEL_PATH: str = "app/core/rbac_model.conf"
    
    class Config:
        case_sensitive = True
        # env_file = ".env"  # 暂时禁用，避免编码问题


settings = Settings()
print(f"Database Type: {settings.DATABASE_TYPE}")
print(f"Database URI: {settings.SQLALCHEMY_DATABASE_URI}")
print(f"Search Index Dir: {settings.SEARCH_INDEX_DIR}") 