from datetime import datetime
from typing import List, Optional
from .chat import Chat


class Session:
    """会话类，表示一个包含多个对话的会话"""
    
    def __init__(
        self,
        session_id: str,
        organization_id: str,
        name: Optional[str] = None,
        created_at: Optional[datetime] = None,
        chats: Optional[List[Chat]] = None,
    ):
        """
        初始化一个会话
        
        参数:
            session_id: 会话唯一标识符
            organization_id: 机构号
            name: 会话名称
            created_at: 创建时间，默认为当前时间
            chats: 对话列表，默认为空列表
        """
        self.session_id = session_id
        self.organization_id = organization_id
        self.name = name
        self.created_at = created_at or datetime.now()
        self.chats = chats or []
    
    def add_chat(self, chat: Chat) -> None:
        """
        添加一个对话到会话中
        
        参数:
            chat: 对话对象
        """
        # 确保对话关联到当前会话
        chat.session_id = self.session_id
        self.chats.append(chat)
    
    def get_chats(self) -> List[Chat]:
        """获取会话中的所有对话"""
        return self.chats
    
    def get_chat_by_id(self, chat_id: str) -> Optional[Chat]:
        """
        通过ID获取特定对话
        
        参数:
            chat_id: 对话ID
            
        返回:
            找到的对话对象，如果未找到则返回None
        """
        for chat in self.chats:
            if chat.chat_id == chat_id:
                return chat
        return None
    
    def to_dict(self) -> dict:
        """将会话转换为字典格式"""
        return {
            "session_id": self.session_id,
            "organization_id": self.organization_id,
            "name": self.name,
            "created_at": self.created_at.isoformat(),
            "chats": [chat.to_dict() for chat in self.chats]
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Session":
        """从字典创建会话对象"""
        from .chat import Chat
        
        created_at = datetime.fromisoformat(data["created_at"]) if "created_at" in data else None
        chats = []
        
        if "chats" in data:
            chats = [Chat.from_dict(chat_data) for chat_data in data["chats"]]
        
        return cls(
            session_id=data["session_id"],
            organization_id=data["organization_id"],
            name=data.get("name"),
            created_at=created_at,
            chats=chats
        ) 