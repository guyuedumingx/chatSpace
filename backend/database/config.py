from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# 根据数据库类型创建引擎
def create_database_engine():
    """创建数据库引擎"""
    if settings.DATABASE_TYPE.lower() == "sqlserver":
        # 创建SQL Server引擎
        return create_engine(
            settings.SQLALCHEMY_DATABASE_URI,
            pool_pre_ping=settings.DB_POOL_PRE_PING,
            pool_recycle=settings.DB_POOL_RECYCLE,
            echo=settings.DB_ECHO
        )
    else:
        # SQLite配置（默认）
        return create_engine(
            settings.SQLALCHEMY_DATABASE_URI, 
            connect_args={"check_same_thread": False},
            echo=settings.DB_ECHO
        )

# 创建数据库引擎
engine = create_database_engine()

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()

# 获取数据库会话
def get_db():
    """数据库会话依赖注入"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 初始化数据库
def init_db():
    """初始化数据库表"""
    Base.metadata.create_all(bind=engine)

# 导出配置信息（向后兼容）
DATABASE_TYPE = settings.DATABASE_TYPE
SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI
INDEX_DIR = settings.SEARCH_INDEX_DIR

print(f"Database Type: {DATABASE_TYPE}")
print(f"Database URL: {SQLALCHEMY_DATABASE_URL}")
print(f"Search Index Dir: {INDEX_DIR}")