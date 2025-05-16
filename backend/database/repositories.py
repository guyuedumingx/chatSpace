from sqlalchemy.orm import Session as DBSession
from typing import List, Optional, Dict, Any
from .models import Session, Chat, Message


class SessionRepository:
    def __init__(self, db: DBSession):
        self.db = db

    def create(self, organization_id: str, name: Optional[str] = None) -> Session:
        """创建新会话"""
        db_session = Session(organization_id=organization_id, name=name)
        self.db.add(db_session)
        self.db.commit()
        self.db.refresh(db_session)
        return db_session

    def get_by_id(self, session_id: str) -> Optional[Session]:
        """通过ID获取会话"""
        return self.db.query(Session).filter(Session.session_id == session_id).first()

    def get_all_by_organization(self, organization_id: str) -> List[Session]:
        """获取机构的所有会话"""
        return self.db.query(Session).filter(Session.organization_id == organization_id).all()

    def update(self, session_id: str, data: Dict[str, Any]) -> Optional[Session]:
        """更新会话信息"""
        db_session = self.get_by_id(session_id)
        if db_session:
            for key, value in data.items():
                if hasattr(db_session, key):
                    setattr(db_session, key, value)
            self.db.commit()
            self.db.refresh(db_session)
        return db_session

    def delete(self, session_id: str) -> bool:
        """删除会话"""
        db_session = self.get_by_id(session_id)
        if db_session:
            self.db.delete(db_session)
            self.db.commit()
            return True
        return False


class ChatRepository:
    def __init__(self, db: DBSession):
        self.db = db

    def create(self, session_id: str, title: Optional[str] = None) -> Chat:
        """创建新对话"""
        db_chat = Chat(session_id=session_id, title=title)
        self.db.add(db_chat)
        self.db.commit()
        self.db.refresh(db_chat)
        return db_chat

    def get_by_id(self, chat_id: str) -> Optional[Chat]:
        """通过ID获取对话"""
        return self.db.query(Chat).filter(Chat.chat_id == chat_id).first()

    def get_all_by_session(self, session_id: str) -> List[Chat]:
        """获取会话的所有对话"""
        return self.db.query(Chat).filter(Chat.session_id == session_id).all()
    
    def update(self, chat_id: str, data: Dict[str, Any]) -> Optional[Chat]:
        """更新对话信息"""
        db_chat = self.get_by_id(chat_id)
        if db_chat:
            for key, value in data.items():
                if hasattr(db_chat, key):
                    setattr(db_chat, key, value)
            self.db.commit()
            self.db.refresh(db_chat)
        return db_chat

    def delete(self, chat_id: str) -> bool:
        """删除对话"""
        db_chat = self.get_by_id(chat_id)
        if db_chat:
            self.db.delete(db_chat)
            self.db.commit()
            return True
        return False


class MessageRepository:
    def __init__(self, db: DBSession):
        self.db = db

    def create(self, chat_id: str, content: str, sender: str) -> Message:
        """创建新消息"""
        db_message = Message(chat_id=chat_id, content=content, sender=sender)
        self.db.add(db_message)
        self.db.commit()
        self.db.refresh(db_message)
        return db_message

    def get_by_id(self, message_id: str) -> Optional[Message]:
        """通过ID获取消息"""
        return self.db.query(Message).filter(Message.message_id == message_id).first()

    def get_all_by_chat(self, chat_id: str) -> List[Message]:
        """获取对话的所有消息"""
        return self.db.query(Message).filter(Message.chat_id == chat_id).all()
    
    def update(self, message_id: str, data: Dict[str, Any]) -> Optional[Message]:
        """更新消息信息"""
        db_message = self.get_by_id(message_id)
        if db_message:
            for key, value in data.items():
                if hasattr(db_message, key):
                    setattr(db_message, key, value)
            self.db.commit()
            self.db.refresh(db_message)
        return db_message

    def delete(self, message_id: str) -> bool:
        """删除消息"""
        db_message = self.get_by_id(message_id)
        if db_message:
            self.db.delete(db_message)
            self.db.commit()
            return True
        return False 