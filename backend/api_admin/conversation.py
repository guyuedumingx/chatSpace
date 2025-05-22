from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from database.config import get_db
from database.models import Topic, Org, Chat, Message, Session
from security import verify_token
from database.crud import chat as chat_crud
import json
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
    prompts: Optional[List[Dict[str, Any]]] = None
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
    chats = chat_crud.getByFilter(
        db,
        skip=(page-1)*pageSize,
        limit=pageSize,
        orgCode=branchId,
        startDate=startDate,
        endDate=endDate,
        searchTerm=searchTerm,
        solvedFilter=solvedFilter
    )
    return {
        "data": [
            {
                "id": chat.chatId,
                "time": str(chat.createdAt),
                "branchId": chat.session.organization.orgCode,
                "branchName": chat.session.organization.orgName,
                "subBranchName": chat.session.organization.orgName,
                "topic": chat.chatName,
                "satisfaction": {
                    "solved": chat.survey.solved if chat.survey else 'yes',
                    "comment": chat.survey.comment if chat.survey else '',
                    "timestamp": str(chat.survey.createdAt) if chat.survey else str(chat.createdAt)
                }
            }
            for chat in chats
        ],
        "total": len(chats),
        "page": page,
        "pageSize": pageSize
    }

@router.get("/conversations/{chat_id}", response_model=ConversationDetailResponse)
async def get_conversation_detail(
    chat_id: str,
    current_user = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """获取对话详情"""
    # 从数据库获取对话详情
    chat = chat_crud.getByChatId(db, chat_id)
    
    if not chat:
        raise HTTPException(status_code=404, detail="对话不存在")
    
    # 获取消息
    messages = []
    for msg in chat.messages:
        messages.append({
            "id": msg.messageId,
            "role": msg.sender,
            "content": msg.content,
            "prompts": json.loads(msg.prompts) if msg.prompts else None,
            "timestamp": str(msg.timestamp)
        })
    
    # 构建响应
    return {
        "id": chat.chatId,
        "time": str(chat.createdAt),
        "branchId": chat.session.organization.orgCode,
        "branchName": chat.session.organization.orgName,
        "subBranchName": chat.session.organization.orgName,
        "topic": chat.chatName,
        "satisfaction": {
            "solved": chat.survey.solved if chat.survey else None,
            "comment": chat.survey.comment if chat.survey else '',
            "timestamp": str(chat.survey.createdAt) if chat.survey else str(chat.createdAt)
        },
        "messages": messages
    }

@router.get("/branch_options")
async def get_branch_options(
    current_user = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """获取分行选项"""
    # 从数据库获取所有组织
    orgs = db.query(Org).all()
    
    # 构建组织选项列表
    org_options = []
    for org in orgs:
        org_options.append({
            "value": org.orgCode,
            "label": org.orgName
        })
    
    # 现阶段简化处理，不区分一级分行和网点
    return {
        "branches": org_options,
        "subBranches": []
    }
