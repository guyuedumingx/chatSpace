from datetime import datetime
from typing import List, Optional
from .message import Message


class Chat:
    """对话类，表示一个包含多条消息的对话"""
    
    def __init__(
        self,
        chatName: str,
        title: Optional[str] = None,
        createdAt: Optional[datetime] = None,
        messages: Optional[List[Message]] = None,
    ):
        """
        初始化一个对话
        
        参数:
            chatId: 对话标识
            chatName: 对话名称
            title: 对话标题
            createdAt: 创建时间，默认为当前时间
            messages: 消息列表，默认为空列表
        """
        self.chatName = chatName
        self.title = title
        self.createdAt = createdAt or datetime.now()
        self.messages = messages or []
    
    def addMessage(self, message: Message) -> None:
        """
        添加一条消息到对话中
        
        参数:
            message: 消息对象
        """
        self.messages.append(message)
    
    def getMessages(self) -> List[Message]:
        """获取对话中的所有消息"""
        return self.messages
    
    def toBriefDict(self) -> dict:
        """对话转换成无message字典"""
        return {
            "key": self.chatId,
            "label": "业务咨询",
            "group": "今天",
        }

    def toDict(self) -> dict:
        """将对话转换为字典格式"""
        return {
            "key": self.chatId,
            "label": self.title,
            "group": self.createdAt.isoformat(),
            "messages": [message.toDict() for message in self.messages]
        }
    
    @classmethod
    def fromDict(cls, data: dict) -> "Chat":
        """从字典创建对话对象"""
        from .message import Message
        
        createdAt = datetime.fromisoformat(data["createdAt"]) if "createdAt" in data else None
        messages = []
        
        if "messages" in data:
            messages = [Message.fromDict(msgData) for msgData in data["messages"]]
        
        return cls(
            chatId=data["chatId"],
            sessionId=data["sessionId"],
            title=data.get("title"),
            createdAt=createdAt,
            messages=messages
        )

    def generateResponse(self, userInput):
        # 聊天模型处理逻辑
        # 可按需加载模型，处理用户输入，生成回复
        response = "模型生成的回复"  # 实际中应调用模型
        
        # 自动记录对话
        self.addMessage(Message(role="user", content=userInput))
        self.addMessage(Message(role="assistant", content=response))
        
        return response

        

