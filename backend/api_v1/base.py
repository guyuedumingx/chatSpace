from fastapi import HTTPException, Depends, APIRouter
from datetime import datetime, timedelta
import uvicorn
from sqlalchemy.orm import Session

from database.config import get_db
from database.crud import org, session as session_crud, chat, message, hot_topic
from database import schema


# 创建路由器
router = APIRouter(prefix="/api")

mock_hot_topics = [
  {
    "key": "1-1",
    "description": "如何办理对公账户开户？",
    "icon": "1",
  },
  {
    "key": "1-2",
    "description": "企业网银如何开通？",
    "icon": "2",
  },
  {
    "key": "1-3",
    "description": "对公转账限额是多少？",
    "icon": "3",
  },
  {
    "key": "1-4",
    "description": "如何申请企业贷款？",
    "icon": "4",
  },
  {
    "key": "1-5",
    "description": "企业理财有哪些产品？",
    "icon": "5",
  },
]


@router.get("/hot_topics")
async def get_hot_topics(db: Session = Depends(get_db)):
    # 从数据库获取热门话题
    db_hot_topics = hot_topic.getAllOrderedByOrder(db)
    
    # 如果数据库中没有热门话题，则返回模拟数据
    if not db_hot_topics:
        return mock_hot_topics
    
    # 转换为前端所需格式
    topics = []
    for topic in db_hot_topics:
        topics.append({
            "key": topic.topicId,
            "description": topic.description,
            "icon": topic.icon or ""
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