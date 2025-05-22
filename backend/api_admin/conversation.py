from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

from database.config import get_db
from database.models import Topic, Org, Chat, Message, Session
from security import verify_token

router = APIRouter()

# 定义响应模型
class ConversationResponse(BaseModel):
    id: str
    time: str
    branchId: str
    branchName: str
    subBranchName: str
    topic: str
    satisfaction: Optional[Dict[str, Any]] = None

class ConversationsListResponse(BaseModel):
    data: List[ConversationResponse]
    total: int
    page: int
    pageSize: int

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str

class ConversationDetailResponse(BaseModel):
    id: str
    time: str
    branchId: str
    branchName: str
    subBranchName: str
    topic: str
    satisfaction: Optional[Dict[str, Any]] = None
    messages: List[MessageResponse]

# 模拟数据 - 在实际应用中应从数据库获取
def get_mock_conversations():
    return [
        {
            "id": "session-1-20231116102345",
            "time": "2023-11-16 10:23:45",
            "branchId": "1001001",
            "branchName": "北京分行",
            "subBranchName": "朝阳支行",
            "topic": "企业开户咨询",
            "satisfaction": {
                "solved": "yes",
                "comment": "解答很清晰，感谢帮助！",
                "timestamp": "2023-11-16 10:30:12"
            }
        },
        {
            "id": "session-2-20231116111233",
            "time": "2023-11-16 11:12:33",
            "branchId": "2",
            "branchName": "金融中心支行",
            "subBranchName": "金融中心支行",
            "topic": "对公转账限额",
            "satisfaction": {
                "solved": "yes",
                "timestamp": "2023-11-16 11:17:03"
            }
        },
        {
            "id": "session-3-20231116134521",
            "time": "2023-11-16 13:45:21",
            "branchId": "3",
            "branchName": "城东支行",
            "subBranchName": "城东支行",
            "topic": "网银开通流程",
            "satisfaction": {
                "solved": "no",
                "comment": "问题太复杂，需要人工处理",
                "timestamp": "2023-11-16 13:54:30"
            }
        },
        {
            "id": "session-4-20231116140340",
            "time": "2023-11-16 14:03:40",
            "branchId": "1",
            "branchName": "总行营业部",
            "subBranchName": "总行营业部",
            "topic": "理财产品咨询",
            "satisfaction": {
                "solved": "yes",
                "comment": "非常满意，谢谢！",
                "timestamp": "2023-11-16 14:11:15"
            }
        },
        {
            "id": "session-5-20231116150555",
            "time": "2023-11-16 15:05:55",
            "branchId": "5",
            "branchName": "城西支行",
            "subBranchName": "城西支行",
            "topic": "密码重置问题",
            "satisfaction": {
                "solved": "no",
                "comment": "需要提供更具体的信息",
                "timestamp": "2023-11-16 15:10:25"
            }
        }
    ]

def get_mock_messages(conversation_id: str):
    if conversation_id == "session-1-20231116102345":
        return [
            {
                "id": "msg1",
                "role": "user",
                "content": "你好，我想了解企业开户需要准备哪些材料？",
                "timestamp": "2023-11-16 10:23:45",
            },
            {
                "id": "msg2",
                "role": "assistant",
                "content": "您好，企业开户需要准备以下材料：1. 营业执照原件及复印件；2. 组织机构代码证原件及复印件；3. 税务登记证原件及复印件；4. 法人身份证原件及复印件；5. 经办人身份证原件及复印件；6. 公司章程；7. 开户许可证。若您已经完成三证合一，则只需要提供新版营业执照。",
                "timestamp": "2023-11-16 10:23:48",
            },
            {
                "id": "msg3",
                "role": "user",
                "content": "我们已经完成了三证合一，那么除了新版营业执照还需要带什么？",
                "timestamp": "2023-11-16 10:24:10",
            },
            {
                "id": "msg4",
                "role": "assistant",
                "content": "如果您已完成三证合一，除了新版营业执照外，还需要准备：1. 法人身份证原件及复印件；2. 经办人身份证原件及复印件；3. 公司章程；4. 开户许可证（如果是首次开户则无需提供）；5. 企业公章、财务章和法人章。请问您是首次开立企业账户吗？",
                "timestamp": "2023-11-16 10:24:15",
            },
            {
                "id": "msg5",
                "role": "user",
                "content": "是的，这是我们公司首次开户",
                "timestamp": "2023-11-16 10:24:32",
            },
            {
                "id": "msg6",
                "role": "assistant",
                "content": "了解了。作为首次开户，您需要在银行开立基本账户。办理流程大致为：1. 到银行网点提交申请材料；2. 银行审核材料；3. 签订账户管理协议；4. 银行为您核发开户许可证；5. 激活账户并办理网银等配套服务。建议您提前预约网点办理，可以节省等待时间。我们总行营业部和各支行都可以办理企业开户业务，您可以选择就近的网点。",
                "timestamp": "2023-11-16 10:24:38",
            }
        ]
    else:
        # 生成随机消息
        messages = []
        msg_count = random.randint(2, 5) * 2  # 确保偶数，这样每对问答完整
        start_time = datetime.strptime(conversation_id.split("-")[2][:8], "%Y%m%d")
        
        for i in range(msg_count):
            role = "user" if i % 2 == 0 else "assistant"
            msg_time = start_time + timedelta(minutes=i*2)
            
            messages.append({
                "id": f"msg_{conversation_id}_{i}",
                "role": role,
                "content": f"{'用户询问' if role == 'user' else '智能助手回复'} {i//2 + 1}",
                "timestamp": msg_time.strftime("%Y-%m-%d %H:%M:%S")
            })
            
        return messages

@router.get("/conversations", response_model=ConversationsListResponse)
async def get_conversations(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    branchId: Optional[str] = None,
    searchTerm: Optional[str] = None,
    solvedFilter: Optional[str] = None,
    current_user = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """获取对话列表"""
    # 在实际应用中，应该从数据库获取数据
    # 这里使用模拟数据
    conversations = get_mock_conversations()
    
    # 应用筛选条件
    filtered_convs = conversations
    
    if startDate and endDate:
        start = datetime.strptime(startDate, "%Y-%m-%d")
        end = datetime.strptime(endDate, "%Y-%m-%d") + timedelta(days=1)  # 包含结束日期
        filtered_convs = [
            c for c in filtered_convs 
            if start <= datetime.strptime(c["time"], "%Y-%m-%d %H:%M:%S") < end
        ]
    
    if branchId:
        filtered_convs = [c for c in filtered_convs if c["branchId"] == branchId]
    
    if searchTerm:
        filtered_convs = [
            c for c in filtered_convs 
            if searchTerm.lower() in c["topic"].lower() or searchTerm in c["id"]
        ]
    
    if solvedFilter:
        if solvedFilter == "yes":
            filtered_convs = [
                c for c in filtered_convs 
                if c.get("satisfaction") and c["satisfaction"]["solved"] == "yes"
            ]
        elif solvedFilter == "no":
            filtered_convs = [
                c for c in filtered_convs 
                if c.get("satisfaction") and c["satisfaction"]["solved"] == "no"
            ]
    
    # 计算分页
    total = len(filtered_convs)
    start_idx = (page - 1) * pageSize
    end_idx = min(start_idx + pageSize, total)
    
    return {
        "data": filtered_convs[start_idx:end_idx],
        "total": total,
        "page": page,
        "pageSize": pageSize
    }

@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_detail(
    conversation_id: str,
    current_user = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """获取对话详情"""
    # 在实际应用中，应该从数据库获取数据
    # 这里使用模拟数据
    conversations = get_mock_conversations()
    conversation = next((c for c in conversations if c["id"] == conversation_id), None)
    
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")
    
    messages = get_mock_messages(conversation_id)
    
    return {
        **conversation,
        "messages": messages
    }

@router.get("/branch_options")
async def get_branch_options(
    current_user = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """获取分行选项"""
    # 在实际应用中，应该从数据库获取数据
    # 这里使用模拟数据
    branch_options = [
        {"value": "1001", "label": "北京分行"},
        {"value": "1002", "label": "上海分行"},
        {"value": "1003", "label": "广州分行"}
    ]
    
    sub_branch_options = [
        {"value": "1001001", "label": "朝阳支行", "parentId": "1001"},
        {"value": "1001002", "label": "海淀支行", "parentId": "1001"},
        {"value": "1002001", "label": "浦东支行", "parentId": "1002"},
        {"value": "1002002", "label": "黄浦支行", "parentId": "1002"}
    ]
    
    return {
        "branches": branch_options,
        "subBranches": sub_branch_options
    }
