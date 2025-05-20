from datetime import datetime
from typing import List, Optional
from .chat import Chat


class Session:
    """会话类，表示一个包含多个对话的会话"""
    
    def __init__(
        self,
        sessionId: Optional[str] = None,
        createdAt: Optional[datetime] = None,
        chats: Optional[List[Chat]] = None,
    ):
        """
        初始化一个会话
        
        参数:
            sessionId: 会话唯一标识符
            createdAt: 创建时间，默认为当前时间
            chats: 对话列表，默认为空列表
        """
        self.sessionId = sessionId
        self.createdAt = createdAt or datetime.now()
        self.chats = chats or []
    
    def addChat(self, chat: Chat) -> None:
        """
        添加一个对话到会话中
        
        参数:
            chat: 对话对象
        """
        # 确保对话关联到当前会话
        self.chats.append(chat)

    def getChats(self) -> List[Chat]:
        """获取会话中的所有对话"""
        return self.chats
    
    def toList(self) -> List:
        """将会话转换为列表格式"""
        return [chat.toBriefDict() for chat in self.chats]
    
    @classmethod
    def fromDict(cls, data: dict) -> "Session":
        """从字典创建会话对象"""
        from .chat import Chat
        
        createdAt = datetime.fromisoformat(data["createdAt"]) if "createdAt" in data else None
        chats = []
        
        if "chats" in data:
            chats = [Chat.fromDict(chatData) for chatData in data["chats"]]
        
        return cls(
            sessionId=data.get("sessionId"),
            createdAt=createdAt,
            chats=chats
        ) 