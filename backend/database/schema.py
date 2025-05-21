from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class MessageBase(BaseModel):
    content: str
    sender: str
    status: str


class MessageResponse(MessageBase):
    messageId: str
    chatId: str
    timestamp: datetime

    class Config:
        orm_mode = True


class ChatBase(BaseModel):
    chatName: str


class ChatCreate(ChatBase):
    sessionId: str


class ChatResponse(ChatBase):
    chatId: str
    sessionId: str
    createdAt: datetime
    messages: List[MessageResponse] = []

    class Config:
        orm_mode = True


class SessionBase(BaseModel):
    orgCode: str


class SessionCreate(SessionBase):
    pass


class SessionResponse(SessionBase):
    sessionId: str
    createdAt: datetime
    chats: List[ChatResponse] = []

    class Config:
        orm_mode = True


class SurveyBase(BaseModel):
    chatId: str
    solved: str
    comment: str

class SurveyCreate(SurveyBase):
    pass

class SurveyResponse(SurveyBase):
    surveyId: str
    createdAt: datetime

    class Config:
        orm_mode = True