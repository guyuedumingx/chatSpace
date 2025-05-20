from datetime import datetime
from typing import Optional


class Message:
    """消息类，表示在对话中的单条消息"""
    
    def __init__(
        self,
        content: str,
        sender: str,
        messageId: Optional[str],
        status: str,
        timestamp: datetime
    ):
        """
        初始化一条消息
        参数:
            content: 消息内容
            sender: 发送者标识
            messageId: 消息唯一标识符
            timestamp: 发送时间，默认为当前时间
            status: 判断消息状态：成功回复或者本地
        """
        self.content = content
        self.sender = sender
        self.messageId = messageId
        self.timestamp = timestamp or datetime.now()
        self.status = status
    
    def toDict(self) -> dict:
        """将消息转换为字典格式"""
        return {
            "id": self.messageId,
            "message": {
                "role": self.sender,
                "content": self.content,
            },
            "status": self.status,
        }
    
    @classmethod
    def fromDict(cls, data: dict) -> "Message":
        """从字典创建消息对象"""
        timestamp = datetime.fromisoformat(data["timestamp"]) if "timestamp" in data else None
        
        return cls(
            content=data["message"]["content"],
            sender=data["message"]["role"],
            messageId=data["id"],
            timestamp=timestamp,
        )
