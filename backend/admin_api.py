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
router = APIRouter(prefix="/api/admin")

# 包含conversation路由
router.include_router(conversation_router, prefix="/conversation", tags=["conversation"])
router.include_router(questionbank_router,prefix="/questionbank", tags=["questionbank"])

# 模拟数据 - 在实际应用中应从数据库获取
mock_organizations = [
    {
        "orgCode": "36909",
        "orgName": "集约运营中心（广东）",
        "conversationCount": 376,
        "dailyActiveUsers": 42,
        "avgSatisfactionRate": 0.85,
        "solvedRate": 0.92
    },
    {
        "orgCode": "12345",
        "orgName": "东莞分行",
        "conversationCount": 245,
        "dailyActiveUsers": 28,
        "avgSatisfactionRate": 0.78,
        "solvedRate": 0.85
    },
    {
        "orgCode": "23456",
        "orgName": "广州分行",
        "conversationCount": 312,
        "dailyActiveUsers": 35,
        "avgSatisfactionRate": 0.82,
        "solvedRate": 0.88
    },
    {
        "orgCode": "34567",
        "orgName": "深圳分行",
        "conversationCount": 298,
        "dailyActiveUsers": 33,
        "avgSatisfactionRate": 0.80,
        "solvedRate": 0.87
    },
    {
        "orgCode": "45678",
        "orgName": "珠海分行",
        "conversationCount": 178,
        "dailyActiveUsers": 21,
        "avgSatisfactionRate": 0.76,
        "solvedRate": 0.83
    },
    {
        "orgCode": "56789",
        "orgName": "佛山分行",
        "conversationCount": 201,
        "dailyActiveUsers": 25,
        "avgSatisfactionRate": 0.79,
        "solvedRate": 0.85
    }
]

# 生成模拟对话记录
def generate_mock_conversations(count=100):
    conversations = []
    
    for i in range(count):
        org = random.choice(mock_organizations)
        start_time = datetime.now() - timedelta(days=random.randint(0, 30), 
                                              hours=random.randint(0, 23), 
                                              minutes=random.randint(0, 59))
        end_time = start_time + timedelta(minutes=random.randint(3, 45))
        
        has_survey = random.random() > 0.3  # 70% 的对话有满意度调查
        
        messages = []
        msg_count = random.randint(2, 10)
        current_time = start_time
        
        for j in range(msg_count):
            role = 'user' if j % 2 == 0 else 'assistant'
            content = f"{'用户询问' if role == 'user' else '智能助手回复'} {j//2 + 1}"
            current_time = current_time + timedelta(minutes=random.randint(1, 5))
            
            messages.append({
                "id": f"msg_{i}_{j}",
                "role": role,
                "content": content,
                "timestamp": current_time.isoformat()
            })
        
        conversations.append({
            "id": f"conv_{i}",
            "orgCode": org["orgCode"],
            "orgName": org["orgName"],
            "startTime": start_time.isoformat(),
            "endTime": end_time.isoformat(),
            "userName": f"用户{i}",
            "userPhone": f"1385{random.randint(1000000, 9999999)}",
            "messages": messages,
            "status": "closed",
            "hasSurvey": has_survey
        })
    
    return conversations

# 生成模拟满意度调查
def generate_mock_surveys(conversations):
    surveys = []
    
    for conv in conversations:
        if conv["hasSurvey"]:
            solved = 'yes' if random.random() > 0.2 else 'no'  # 80% 的对话被解决
            
            surveys.append({
                "id": f"survey_{conv['id']}",
                "conversationId": conv["id"],
                "orgCode": conv["orgCode"],
                "orgName": conv["orgName"],
                "timestamp": conv["endTime"],
                "solved": solved,
                "comment": "用户满意度评价内容" if random.random() > 0.5 else None,
                "userName": conv["userName"],
                "userPhone": conv["userPhone"]
            })
    
    return surveys

# 初始化模拟数据
mock_conversations = generate_mock_conversations(100)
mock_surveys = generate_mock_surveys(mock_conversations)

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

@router.get("/branches")
async def get_branches(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    keyword: Optional[str] = None,
    current_user = Depends(verify_token)
):
    filtered_orgs = mock_organizations
    
    if keyword:
        filtered_orgs = [
            org for org in filtered_orgs 
            if keyword.lower() in org["orgName"].lower() or keyword in org["orgCode"]
        ]
    
    total = len(filtered_orgs)
    start_idx = (page - 1) * pageSize
    end_idx = start_idx + pageSize
    
    return {
        "data": filtered_orgs[start_idx:end_idx],
        "total": total,
        "page": page,
        "pageSize": pageSize
    }

@router.get("/branches/{org_code}")
async def get_branch_detail(org_code: str, current_user = Depends(verify_token)):
    org = next((o for o in mock_organizations if o["orgCode"] == org_code), None)
    
    if not org:
        raise HTTPException(status_code=404, detail="机构不存在")
    
    # 获取该机构的对话
    branch_conversations = [c for c in mock_conversations if c["orgCode"] == org_code]
    
    return {
        **org,
        "recentConversations": branch_conversations[:5]  # 只返回最近5条对话
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
