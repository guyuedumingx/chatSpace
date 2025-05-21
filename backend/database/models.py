from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .config import Base


class Org(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    orgCode = Column(String, unique=True, index=True)
    orgName = Column(String, nullable=False)
    password = Column(String, nullable=False)  # 实际应存储加密后的密码
    isFirstLogin = Column(Boolean, default=True)
    passwordLastChanged = Column(DateTime, default=datetime.now)
    
    # 关系：一个组织只对应一个会话
    session = relationship("Session", uselist=False, back_populates="organization", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    sessionId = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    orgCode = Column(String, ForeignKey("organizations.orgCode"), unique=True)
    createdAt = Column(DateTime, default=datetime.now)

    # 关系：一个会话属于一个组织，一个会话有多个对话
    organization = relationship("Org", back_populates="session")
    chats = relationship("Chat", back_populates="session", cascade="all, delete-orphan")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    chatId = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    sessionId = Column(String, ForeignKey("sessions.sessionId"))
    chatName = Column(String, nullable=False)
    title = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.now)

    # 关系：一个对话属于一个会话，一个对话有多条消息
    session = relationship("Session", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    messageId = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    chatId = Column(String, ForeignKey("chats.chatId"))
    content = Column(Text, nullable=False)
    sender = Column(String, nullable=False)
    status = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)

    # 关系：一条消息属于一个对话
    chat = relationship("Chat", back_populates="messages")


class HotTopic(Base):
    __tablename__ = "hot_topics"
    
    id = Column(Integer, primary_key=True, index=True)
    topicId = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    description = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    order = Column(Integer, default=0)  # 排序字段 