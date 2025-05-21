from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 创建SQLite数据库引擎
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
print(BASE_DIR)
SQLALCHEMY_DATABASE_URL = "sqlite:///" + os.path.join(BASE_DIR, "app.db")
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 定义索引目录
INDEX_DIR = BASE_DIR + "/search_index"
# 如果索引目录不存在，创建目录
if not os.path.exists(INDEX_DIR):
    os.mkdir(INDEX_DIR)


# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()

# 获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 初始化数据库
def init_db():
    Base.metadata.create_all(bind=engine) 