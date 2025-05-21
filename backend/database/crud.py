from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Type, TypeVar, Generic
from pydantic import BaseModel
from datetime import datetime
from .models import Org, Session as SessionModel, Chat as ChatModel, Message as MessageModel, HotTopic as HotTopicModel
from beans.org import Org as OrgBean
from beans.session import Session as SessionBean
from beans.chat import Chat as ChatBean
from beans.message import Message as MessageBean

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
    
    def getMulti(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """
        获取多条记录
        """
        return db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, objIn: CreateSchemaType) -> ModelType:
        """
        创建新记录
        """
        objInData = objIn.dict()
        dbObj = self.model(**objInData)
        db.add(dbObj)
        db.commit()
        db.refresh(dbObj)
        return dbObj
    
    def update(self, db: Session, *, dbObj: ModelType, objIn: Dict[str, Any]) -> ModelType:
        """
        更新记录
        """
        for field in objIn:
            if hasattr(dbObj, field):
                setattr(dbObj, field, objIn[field])
        db.add(dbObj)
        db.commit()
        db.refresh(dbObj)
        return dbObj
    
    def remove(self, db: Session, *, id: str) -> ModelType:
        """
        删除记录
        """
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj


class CRUDOrg(CRUDBase[Org, CreateSchemaType]):
    """组织CRUD操作"""
    
    def getByOrgCode(self, db: Session, orgCode: str) -> Optional[Org]:
        """通过orgCode获取组织"""
        return db.query(self.model).filter(self.model.orgCode == orgCode).first()
    
    def changePassword(self, db: Session, orgCode: str, newPassword: str) -> Optional[Org]:
        """更改组织密码"""
        org = self.getByOrgCode(db, orgCode)
        if org:
            org.password = newPassword
            org.passwordLastChanged = datetime.now()
            org.isFirstLogin = False
            db.add(org)
            db.commit()
            db.refresh(org)
        return org
    
    def toBean(self, dbOrg: Org) -> OrgBean:
        """将数据库组织对象转换为Bean对象"""
        return OrgBean(
            orgCode=dbOrg.orgCode,
            org_name=dbOrg.orgName,
            password=dbOrg.password,
            password_last_changed=dbOrg.passwordLastChanged
        )


# 创建具体的CRUD类实例
class CRUDSession(CRUDBase[SessionModel, CreateSchemaType]):
    """会话CRUD操作"""
    
    def getBySessionId(self, db: Session, sessionId: str) -> Optional[SessionModel]:
        """通过sessionId获取会话"""
        return db.query(self.model).filter(self.model.sessionId == sessionId).first()
    
    def getByOrg(self, db: Session, orgCode: str) -> Optional[SessionModel]:
        """获取组织的会话（一个组织只有一个会话）"""
        return db.query(self.model).filter(self.model.orgCode == orgCode).filter(self.model.isDeleted == False).first()
    
    def toBean(self, dbSession: SessionModel, includeChats: bool = False) -> SessionBean:
        """将数据库会话对象转换为Bean对象"""
        sessionBean = SessionBean(created_at=dbSession.createdAt)
        
        if includeChats and dbSession.chats:
            for dbChat in dbSession.chats:
                chatBean = chat.toBean(dbChat, includeMessages=False)
                sessionBean.add_chat(chatBean)
                
        return sessionBean


class CRUDChat(CRUDBase[ChatModel, CreateSchemaType]):
    """对话CRUD操作"""
    
    def getByChatId(self, db: Session, chatId: str) -> Optional[ChatModel]:
        """通过chatId获取对话"""
        return db.query(self.model).filter(self.model.chatId == chatId).first()
    
    def getBySession(self, db: Session, sessionId: str) -> List[ChatModel]:
        """获取会话的所有对话"""
        return db.query(self.model).filter(self.model.sessionId == sessionId).filter(self.model.isDeleted == False).all()
    
    def toBean(self, dbChat: ChatModel, includeMessages: bool = False) -> ChatBean:
        """将数据库对话对象转换为Bean对象"""
        chatBean = ChatBean(
            chat_name=dbChat.chatName,
            title=dbChat.title,
            created_at=dbChat.createdAt
        )
        
        # 如果指定了包含消息，则同时加载消息
        if includeMessages and dbChat.messages:
            for dbMessage in dbChat.messages:
                messageBean = message.toBean(dbMessage)
                chatBean.add_message(messageBean)
                
        return chatBean


class CRUDMessage(CRUDBase[MessageModel, CreateSchemaType]):
    """消息CRUD操作"""
    
    def getByMessageId(self, db: Session, messageId: str) -> Optional[MessageModel]:
        """通过messageId获取消息"""
        return db.query(self.model).filter(self.model.messageId == messageId).first()
    
    def getByChat(self, db: Session, chatId: str) -> List[MessageModel]:
        """获取对话的所有消息"""
        return db.query(self.model).filter(self.model.chatId == chatId).all()
    
    def toBean(self, dbMessage: MessageModel) -> MessageBean:
        """将数据库消息对象转换为Bean对象"""
        return MessageBean(
            content=dbMessage.content,
            sender=dbMessage.sender,
            message_id=dbMessage.messageId,
            status=dbMessage.status,
            timestamp=dbMessage.timestamp
        )


class CRUDHotTopic(CRUDBase[HotTopicModel, CreateSchemaType]):
    """热门话题CRUD操作"""
    
    def getByTopicId(self, db: Session, topicId: str) -> Optional[HotTopicModel]:
        """通过topicId获取热门话题"""
        return db.query(self.model).filter(self.model.topicId == topicId).first()
    
    def getAllOrderedByOrder(self, db: Session) -> List[HotTopicModel]:
        """获取所有热门话题，按order字段排序"""
        return db.query(self.model).order_by(self.model.order).all()


# 创建CRUD实例
org = CRUDOrg(Org)
session = CRUDSession(SessionModel)
chat = CRUDChat(ChatModel)
message = CRUDMessage(MessageModel)
hot_topic = CRUDHotTopic(HotTopicModel) 