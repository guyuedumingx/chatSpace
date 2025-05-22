
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import pandas as pd
from database.config import get_db
from database.models import Topic
from database.crud import topic as topic_crud
from security import verify_token

router = APIRouter()

# 请求/响应模型
class QuestionBase(BaseModel):
    entryCode: str
    onlineCode: str
    questionType: str
    questionDescription: str
    operationGuide: str
    remark: Optional[str] = None
    keywords: List[str]

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: str
    key: str
    importDate: str

    class Config:
        orm_mode = True

# 1. 获取问题列表
@router.get("/questions", response_model=List[QuestionResponse])
async def get_questions(
    db: Session = Depends(get_db),
    current_org = Depends(verify_token),
    page: int = 1,
    page_size: int = 10,
    search_text: Optional[str] = None,
    question_type: Optional[str] = None
):
    query = db.query(Topic).filter(Topic.isDeleted == False)
    
    print("search_text", search_text)
    if search_text:
        query = query.filter(
            (Topic.description.ilike(f"%{search_text}%")) |
            (Topic.keywords.ilike(f"%{search_text}%")) |
            (Topic.inTrcd.ilike(f"%{search_text}%")) |
            (Topic.trcd.ilike(f"%{search_text}%"))
        )
    
    if question_type:
        query = query.filter(Topic.topicType == question_type)
    
    total = query.count()
    #questions = query.offset((page - 1) * page_size).limit(page_size).all()
    questions=query.all()
    return [
        {
            "id": str(q.id),
            "key": q.topicId,
            "importDate": q.createdAt.strftime("%Y-%m-%d"),
            "entryCode": q.inTrcd,
            "onlineCode": q.trcd,
            "questionType": q.topicType,
            "questionDescription": q.description,
            "operationGuide": q.operator,
            "remark": q.addition,
            "keywords": q.keywords.split(",") if q.keywords else []
        }
        for q in questions
    ]

# 2. 创建问题
@router.post("/questions", response_model=QuestionResponse)
async def create_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_org = Depends(verify_token)
):
    db_question = Topic(
        inTrcd=question.entryCode,
        trcd=question.onlineCode,
        topicType=question.questionType,
        description=question.questionDescription,
        operator=question.operationGuide,
        addition=question.remark,
        keywords=",".join(question.keywords)
    )
    
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    return {
        "id": str(db_question.id),
        "key": db_question.topicId,
        "importDate": db_question.createdAt.strftime("%Y-%m-%d"),
        **question.dict()
    }

# 3. 更新问题
@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    question: QuestionUpdate,
    db: Session = Depends(get_db),
    current_org = Depends(verify_token)
):
    db_question = db.query(Topic).filter(Topic.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db_question.inTrcd = question.entryCode
    db_question.trcd = question.onlineCode
    db_question.topicType = question.questionType
    db_question.description = question.questionDescription
    db_question.operator = question.operationGuide
    db_question.addition = question.remark
    db_question.keywords = ",".join(question.keywords)
    
    db.commit()
    db.refresh(db_question)
    
    return {
        "id": str(db_question.id),
        "key": db_question.topicId,
        "importDate": db_question.createdAt.strftime("%Y-%m-%d"),
        **question.dict()
    }

# 4. 删除问题
@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_org = Depends(verify_token)
):
    db_question = db.query(Topic).filter(Topic.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db_question.isDeleted = True
    db.commit()
    
    return {"message": "Question deleted successfully"}

# 5. 导入Excel文件
@router.post("/questions/import")
async def import_questions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_org = Depends(verify_token)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files are allowed")
    
    try:
        df = pd.read_excel(file.file)
        required_columns = ['入口交易码', '联机交易码', '问题种类', '问题描述', '操作指引', '备注', '关键词']
        
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail="Excel file format is incorrect")
        
        for _, row in df.iterrows():
            db_question = Topic(
                inTrcd=str(row['入口交易码']),
                trcd=str(row['联机交易码']),
                topicType=str(row['问题种类']),
                description=str(row['问题描述']),
                operator=str(row['操作指引']),
                addition=str(row['备注']) if pd.notna(row['备注']) else None,
                keywords=str(row['关键词']) if pd.notna(row['关键词']) else None
            )
            db.add(db_question)
        
        db.commit()
        return {"message": "Questions imported successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))