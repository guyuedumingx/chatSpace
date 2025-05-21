from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime



class OrgBase(BaseModel):
    orgCode: str
    orgName: str


class OrgCreate(OrgBase):
    password: str


class OrgResponse(OrgBase):
    isFirstLogin: bool
    passwordLastChanged: datetime
    
    class Config:
        orm_mode = True


class MessageBase(BaseModel):
    content: str
    sender: str
    status: str


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    messageId: str
    chatId: str
    timestamp: datetime

    class Config:
        orm_mode = True


class ChatBase(BaseModel):
    chatName: str
    title: Optional[str] = None


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


class HotTopicBase(BaseModel):
    description: str
    icon: Optional[str] = None
    order: Optional[int] = 0


class HotTopicCreate(HotTopicBase):
    pass


class HotTopicResponse(HotTopicBase):
    topicId: str
    
    class Config:
        orm_mode = True 