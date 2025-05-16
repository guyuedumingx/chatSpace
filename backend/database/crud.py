from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Type, TypeVar, Generic
from pydantic import BaseModel

from .models import Session as SessionModel, Chat, Message

# 定义泛型类型变量
T = TypeVar('T')
CreateSchemaType = TypeVar('CreateSchemaType', bound=BaseModel)
ModelType = TypeVar('ModelType')


class CRUDBase(Generic[ModelType, CreateSchemaType]):
    """
    CRUD操作的基础类，提供通用的创建、读取、更新和删除操作
    """
    
    def __init__(self, model: Type[ModelType]):
        """
        初始化CRUD对象
        
        参数:
            model: SQLAlchemy模型类
        """
        self.model = model
    
    def get(self, db: Session, id: str) -> Optional[ModelType]:
        """
        通过ID获取记录
        """
        return db.query(self.model).filter(self.model.id == id).first()
    
    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """
        获取多条记录
        """
        return db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        创建新记录
        """
        obj_in_data = obj_in.dict()
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(self, db: Session, *, db_obj: ModelType, obj_in: Dict[str, Any]) -> ModelType:
        """
        更新记录
        """
        for field in obj_in:
            if hasattr(db_obj, field):
                setattr(db_obj, field, obj_in[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def remove(self, db: Session, *, id: str) -> ModelType:
        """
        删除记录
        """
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj


# 创建具体的CRUD类实例
class CRUDSession(CRUDBase[SessionModel, CreateSchemaType]):
    """会话CRUD操作"""
    
    def get_by_session_id(self, db: Session, session_id: str) -> Optional[SessionModel]:
        """通过session_id获取会话"""
        return db.query(self.model).filter(self.model.session_id == session_id).first()
    
    def get_by_organization(self, db: Session, organization_id: str) -> List[SessionModel]:
        """获取机构的所有会话"""
        return db.query(self.model).filter(self.model.organization_id == organization_id).all()


class CRUDChat(CRUDBase[Chat, CreateSchemaType]):
    """对话CRUD操作"""
    
    def get_by_chat_id(self, db: Session, chat_id: str) -> Optional[Chat]:
        """通过chat_id获取对话"""
        return db.query(self.model).filter(self.model.chat_id == chat_id).first()
    
    def get_by_session(self, db: Session, session_id: str) -> List[Chat]:
        """获取会话的所有对话"""
        return db.query(self.model).filter(self.model.session_id == session_id).all()


class CRUDMessage(CRUDBase[Message, CreateSchemaType]):
    """消息CRUD操作"""
    
    def get_by_message_id(self, db: Session, message_id: str) -> Optional[Message]:
        """通过message_id获取消息"""
        return db.query(self.model).filter(self.model.message_id == message_id).first()
    
    def get_by_chat(self, db: Session, chat_id: str) -> List[Message]:
        """获取对话的所有消息"""
        return db.query(self.model).filter(self.model.chat_id == chat_id).all()


# 创建CRUD实例
session = CRUDSession(SessionModel)
chat = CRUDChat(Chat)
message = CRUDMessage(Message) 