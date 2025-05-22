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
    contactName = Column(String, nullable=True, default="")
    contactPhone = Column(String, nullable=True, default="")
    contactEhr = Column(String, nullable=True, default="")
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
    isDeleted = Column(Boolean, default=False)

    # 关系：一个会话属于一个组织，一个会话有多个对话
    organization = relationship("Org", back_populates="session")
    chats = relationship("Chat", back_populates="session", cascade="all, delete-orphan")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    chatId = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    sessionId = Column(String, ForeignKey("sessions.sessionId"))
    chatName = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.now)
    isDeleted = Column(Boolean, default=False)
    # 关系：一个对话属于一个会话，一个对话有多条消息
    session = relationship("Session", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")

    # 关系：一个对话有一个调查
    survey = relationship("Survey", back_populates="chat", uselist=False)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    messageId = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    chatId = Column(String, ForeignKey("chats.chatId"))
    content = Column(Text, nullable=False)
    prompts = Column(Text, nullable=True)
    additional_prompt = Column(Text, nullable=True)
    sender = Column(String, nullable=False)
    status = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.now)

    # 关系：一条消息属于一个对话
    chat = relationship("Chat", back_populates="messages")


class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True)
    topicId = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    inTrcd = Column(String, nullable=False)
    trcd = Column(String, nullable=False)
    topicType = Column(String, nullable=False)
    description = Column(String, nullable=False)
    operator = Column(String, nullable=False)
    addition = Column(String, nullable=True)
    order = Column(Integer, default=0)  # 排序字段 
    keywords = Column(String, nullable=True)
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

    id = Column(Integer, primary_key=True, index=True)
    surveyId = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    createdAt = Column(DateTime, default=datetime.now)
    solved = Column(String, nullable=False)
    comment = Column(String, nullable=True)
    chatId = Column(String, ForeignKey("chats.chatId"))

    # 关系：一个调查属于一个对话
    chat = relationship("Chat", back_populates="survey")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    contactName = Column(String, nullable=False)
    contactPhone = Column(String, nullable=False)
    order = Column(Integer, nullable=False)
    createdAt = Column(DateTime, default=datetime.now)

