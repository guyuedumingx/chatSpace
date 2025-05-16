from datetime import datetime
from typing import Optional


class Message:
    """消息类，表示在对话中的单条消息"""
    
    def __init__(
        self,
        content: str,
        sender: str,
        message_id: Optional[str] = None,
        timestamp: Optional[datetime] = None,
        chat_id: Optional[str] = None,
    ):
        """
        初始化一条消息
        参数:
            content: 消息内容
            sender: 发送者标识
            message_id: 消息唯一标识符
            timestamp: 发送时间，默认为当前时间
            chat_id: 所属对话的ID
        """
        self.content = content
        self.sender = sender
        self.message_id = message_id
        self.timestamp = timestamp or datetime.now()
        self.chat_id = chat_id
    
    def to_dict(self) -> dict:
        """将消息转换为字典格式"""
        return {
            "message_id": self.message_id,
            "content": self.content,
            "sender": self.sender,
            "timestamp": self.timestamp.isoformat(),
            "chat_id": self.chat_id
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Message":
        """从字典创建消息对象"""
        timestamp = datetime.fromisoformat(data["timestamp"]) if "timestamp" in data else None
        
        return cls(
            content=data["content"],
            sender=data["sender"],
            message_id=data.get("message_id"),
            timestamp=timestamp,
            chat_id=data.get("chat_id")
        )
