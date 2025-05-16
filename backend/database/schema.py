from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class MessageBase(BaseModel):
    content: str
    sender: str


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    message_id: str
    chat_id: str
    timestamp: datetime

    class Config:
        orm_mode = True


class ChatBase(BaseModel):
    title: Optional[str] = None


class ChatCreate(ChatBase):
    pass


class ChatResponse(ChatBase):
    chat_id: str
    session_id: str
    created_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        orm_mode = True


class SessionBase(BaseModel):
    name: Optional[str] = None
    organization_id: str


class SessionCreate(SessionBase):
    pass


class SessionResponse(SessionBase):
    session_id: str
    created_at: datetime
    chats: List[ChatResponse] = []

    class Config:
        orm_mode = True 