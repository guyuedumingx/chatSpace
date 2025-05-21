from fastapi import HTTPException, Depends, APIRouter
from datetime import datetime, timedelta
import uvicorn
from sqlalchemy.orm import Session

from database.config import get_db
from database.crud import org, session as session_crud, chat, message, hot_topic
from database import schema

router = APIRouter()

# 假设每个会话或用户有固定联系人
mock_contacts = {
    "default-0": {"contactName": "张三", "contactPhone": "13888888888"},
    # 可以添加更多会话key或user_id对应的联系人
}

@router.post("/api/survey")
async def submit_survey(data: dict):
    # data: {solved: 'yes'|'no', comment: str, session_key: str, user_id: str (可选)}
    # 这里可以保存到数据库或日志，这里只打印
    print("收到满意度调查：", data)
    return {"success": True}

@router.get("/api/contact_info")
async def get_contact_info(session_key: str = None, user_id: str = None):
    # 优先用session_key查找联系人
    if session_key and session_key in mock_contacts:
        return mock_contacts[session_key]
    # 也可以根据user_id查找
    # if user_id and user_id in mock_contacts:
    #     return mock_contacts[user_id]
    # 默认返回第一个
    return list(mock_contacts.values())[0]

