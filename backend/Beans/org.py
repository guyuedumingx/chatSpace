from datetime import datetime
from typing import Optional, List


class Org:
    def __init__(
        self,
        orgCode: str, 
        orgName: str, 
        password: str, 
        isFirstLogin: bool = True,
        passwordLastChanged: Optional[datetime] = None
        ):
        self.orgCode = orgCode
        self.orgName = orgName
        self.password = password  # 实际应加密存储
        self.isFirstLogin = isFirstLogin
        self.passwordLastChanged = passwordLastChanged or datetime.now()
        self.session = None
        
    def createSession(self):
        """创建与此组织关联的会话"""
        from .session import Session
        self.session = Session()
        return self.session
        
    def changePassword(self, newPassword: str) -> bool:
        """更改密码"""
        self.password = newPassword
        self.passwordLastChanged = datetime.now()
        self.isFirstLogin = False
        return True
        
    def to_dict(self) -> dict:
        """将组织转换为字典格式"""
        return {
            "orgCode": self.orgCode,
            "orgName": self.orgName,
            "isFirstLogin": self.isFirstLogin,
            "passwordLastChanged": self.passwordLastChanged.isoformat()
        }