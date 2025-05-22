from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random
from security import verify_token
from security import create_access_token
from api_admin.conversation import router as conversation_router
from database.crud import chat as chat_crud, session as session_crud, survey as survey_crud, topic as topic_crud
from database.config import get_db
from api_admin.questionbank import router as questionbank_router
from api_admin.org import router as org_router
router = APIRouter(prefix="/api/admin")

# 包含conversation路由
router.include_router(conversation_router, prefix="/conversation", tags=["conversation"])
router.include_router(questionbank_router,prefix="/questionbank", tags=["questionbank"])
router.include_router(org_router, prefix="/org", tags=["org"])

# API路由
@router.get("/dashboard")
async def get_dashboard_data(current_user = Depends(verify_token)):
    db = next(get_db())
    # 计算今日对话数
    today = datetime.now().date()
    chat_count = chat_crud.countAll(db)
    chat_today_count = chat_crud.countToday(db)
    topic_count = topic_crud.countAll(db)

    survey_count = survey_crud.getAllN0SurveyCount(db)
    solvedRate = (chat_count - survey_count) / chat_count if chat_count else 0
    
    # 生成近7天的对话趋势
    trend_data = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        count = chat_crud.getByDayCount(db, date)
        trend_data.append({
            "date": date.isoformat(),
            "count": count
        })
    

    # 生成排名前5的机构
    chat_top5 = chat_crud.getByOrgCodeTop7(db)
    
    
    return {
        "totalConversations": chat_count,
        "todayConversations": chat_today_count,
        "solvedRate": solvedRate,
        "conversationTrend": trend_data,
        "topBranches": chat_top5,
        "topics": topic_count
    }

@router.get("/export/{data_type}")
async def export_data(
    data_type: str,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    orgCode: Optional[str] = None,
    current_user = Depends(verify_token)
):
    # 这里只返回一个模拟消息，在实际应用中应生成并返回CSV文件
    return {"message": f"导出 {data_type} 数据成功"} 
