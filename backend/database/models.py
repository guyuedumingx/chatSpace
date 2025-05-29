from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .config import Base


def generate_uuid():
    return str(uuid.uuid4())


class Org(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    orgCode = Column(String(50), unique=True, index=True)
    orgName = Column(String(200), nullable=False)
    contactName = Column(String(100), nullable=True, default="")
    contactPhone = Column(String(50), nullable=True, default="")
    contactEhr = Column(String(200), nullable=True, default="")
    password = Column(String(255), nullable=False)  # 实际应存储加密后的密码
    isFirstLogin = Column(Boolean, default=True)
    passwordLastChanged = Column(DateTime, default=datetime.now)
    
    # 关系：一个组织只对应一个会话
    session = relationship("Session", uselist=False, back_populates="organization", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sessionId = Column(String(36), unique=True, index=True, default=generate_uuid)
    orgCode = Column(String(50), ForeignKey("organizations.orgCode"), unique=True)
    createdAt = Column(DateTime, default=datetime.now)
    isDeleted = Column(Boolean, default=False)

    # 关系：一个会话属于一个组织，一个会话有多个对话
    organization = relationship("Org", back_populates="session")
    chats = relationship("Chat", back_populates="session", cascade="all, delete-orphan")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    chatId = Column(String(36), unique=True, index=True, default=generate_uuid)
    sessionId = Column(String(36), ForeignKey("sessions.sessionId"))
    chatName = Column(String(200), nullable=False)
    createdAt = Column(DateTime, default=datetime.now)
    isDeleted = Column(Boolean, default=False)
    # 关系：一个对话属于一个会话，一个对话有多条消息
    session = relationship("Session", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")

    # 关系：一个对话有一个调查
    survey = relationship("Survey", back_populates="chat", uselist=False)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    messageId = Column(String(36), unique=True, index=True, default=generate_uuid)
    chatId = Column(String(36), ForeignKey("chats.chatId"))
    content = Column(Text, nullable=False)
    prompts = Column(Text, nullable=True)
    additional_prompt = Column(Text, nullable=True)
    sender = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.now)

    # 关系：一条消息属于一个对话
    chat = relationship("Chat", back_populates="messages")


class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    topicId = Column(String(36), unique=True, index=True, default=generate_uuid)
    inTrcd = Column(String(100), nullable=False)
    trcd = Column(String(100), nullable=False)
    topicType = Column(String(50), nullable=False)
    description = Column(String(500), nullable=False)
    operator = Column(Text, nullable=False)
    addition = Column(Text, nullable=True)
    order = Column(Integer, default=0)  # 排序字段 
    keywords = Column(String(500), nullable=True)
    createdAt = Column(DateTime, default=datetime.now)
    isDeleted = Column(Boolean, default=False)

    def __getitem__(self, item):
        return getattr(self, item)

    def __setitem__(self, key, value):
        setattr(self, key, value)
    
    def __delitem__(self, key):
        delattr(self, key)

class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    surveyId = Column(String(36), unique=True, index=True, default=generate_uuid)
    createdAt = Column(DateTime, default=datetime.now)
    solved = Column(String(10), nullable=False)
    comment = Column(String(1000), nullable=True)
    chatId = Column(String(36), ForeignKey("chats.chatId"))

    # 关系：一个调查属于一个对话
    chat = relationship("Chat", back_populates="survey")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    contactName = Column(String(100), nullable=False)
    contactPhone = Column(String(50), nullable=False)
    order = Column(Integer, nullable=False)
    createdAt = Column(DateTime, default=datetime.now)

