from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .config import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String, index=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    # 关系：一个会话有多个对话
    chats = relationship("Chat", back_populates="session", cascade="all, delete-orphan")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.session_id"))
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    # 关系：一个对话属于一个会话，一个对话有多条消息
    session = relationship("Session", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    chat_id = Column(String, ForeignKey("chats.chat_id"))
    content = Column(Text, nullable=False)
    sender = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)

    # 关系：一条消息属于一个对话
    chat = relationship("Chat", back_populates="messages") 