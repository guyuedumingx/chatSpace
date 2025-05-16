from datetime import datetime
from typing import List, Optional
from .message import Message


class Chat:
    """对话类，表示一个包含多条消息的对话"""
    
    def __init__(
        self,
        chat_id: str,
        session_id: str,
        title: Optional[str] = None,
        created_at: Optional[datetime] = None,
        messages: Optional[List[Message]] = None,
    ):
        """
        初始化一个对话
        
        参数:
            chat_id: 对话唯一标识符
            session_id: 所属会话的ID
            title: 对话标题
            created_at: 创建时间，默认为当前时间
            messages: 消息列表，默认为空列表
        """
        self.chat_id = chat_id
        self.session_id = session_id
        self.title = title
        self.created_at = created_at or datetime.now()
        self.messages = messages or []
    
    def add_message(self, message: Message) -> None:
        """
        添加一条消息到对话中
        
        参数:
            message: 消息对象
        """
        # 确保消息关联到当前对话
        message.chat_id = self.chat_id
        self.messages.append(message)
    
    def get_messages(self) -> List[Message]:
        """获取对话中的所有消息"""
        return self.messages
    
    def to_dict(self) -> dict:
        """将对话转换为字典格式"""
        return {
            "chat_id": self.chat_id,
            "session_id": self.session_id,
            "title": self.title,
            "created_at": self.created_at.isoformat(),
            "messages": [message.to_dict() for message in self.messages]
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Chat":
        """从字典创建对话对象"""
        from .message import Message
        
        created_at = datetime.fromisoformat(data["created_at"]) if "created_at" in data else None
        messages = []
        
        if "messages" in data:
            messages = [Message.from_dict(msg_data) for msg_data in data["messages"]]
        
        return cls(
            chat_id=data["chat_id"],
            session_id=data["session_id"],
            title=data.get("title"),
            created_at=created_at,
            messages=messages
        )

        

