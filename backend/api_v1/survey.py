from fastapi import HTTPException, Depends, APIRouter
from datetime import datetime, timedelta
import uvicorn
from sqlalchemy.orm import Session

from database.config import get_db
from database.crud import org, session as session_crud, chat, message
from database import schema

router = APIRouter()

# 假设每个会话或用户有固定联系人
mock_contacts = [
    {"contactName": "张三", "contactPhone": "13888888888"},
    {"contactName": "李四", "contactPhone": "13999999999"},
    {"contactName": "王五", "contactPhone": "13777777777"},
    {"contactName": "赵六", "contactPhone": "13666666666"},
    {"contactName": "孙七", "contactPhone": "13555555555"},
    {"contactName": "周八", "contactPhone": "13444444444"},
    {"contactName": "吴九", "contactPhone": "13333333333"},
    {"contactName": "郑十", "contactPhone": "13222222222"},
]

@router.post("/api/survey")
async def submit_survey(data: dict):
    # data: {solved: 'yes'|'no', comment: str, session_key: str, user_id: str (可选)}
    # 这里可以保存到数据库或日志，这里只打印
    print("收到满意度调查：", data)
    return {"success": True}

@router.get("/api/contact_info")
async def get_contact_info(session_key: str = None, user_id: str = None):
    return mock_contacts

