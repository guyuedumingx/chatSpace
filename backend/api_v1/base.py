from fastapi import HTTPException, Depends, APIRouter, Query
from datetime import datetime, timedelta
import uvicorn
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel

from database.config import get_db
from database.crud import org, session as session_crud, chat, message
from database.models import Topic


# 创建路由器
router = APIRouter(prefix="/api")


@router.get("/hot_topics")
async def get_hot_topics(db: Session = Depends(get_db)):
    # 从数据库获取热门话题
    db_hot_topics = db.query(Topic).filter(Topic.isDeleted == False).order_by(Topic.order).limit(5).all()
    
    # 转换为前端所需格式
    topics = []
    for topic in db_hot_topics:
        topics.append({
            "key": topic.topicId,
            "description": topic.description,
            "icon": topic.order  # 使用order字段替代icon
        })
    
    return topics

@router.get("/org/{orgCode}")
async def get_org_info(orgCode: str, db: Session = Depends(get_db)):
    db_org = org.getByOrgCode(db, orgCode)
    if not db_org:
        raise HTTPException(status_code=404, detail="机构号不存在")
    
    return {
        "orgName": db_org.orgName,
        "isFirstLogin": db_org.isFirstLogin,
        "lastPasswordChangeTime": db_org.passwordLastChanged.isoformat()
    }

if __name__ == "__main__":
    uvicorn.run("api:router", host="0.0.0.0", port=8000)