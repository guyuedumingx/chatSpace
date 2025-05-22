from fastapi import HTTPException, Depends, APIRouter
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.crud import survey as survey_crud
from database.config import get_db
from database.crud import org, session as session_crud, contact as contact_crud
from database import schema
from security import verify_token

router = APIRouter()

@router.post("/api/survey")
async def submit_survey(data: dict, db: Session = Depends(get_db), current_org = Depends(verify_token)):
    # data: {solved: 'yes'|'no', comment: str, session_key: str, user_id: str (可选)}
    # 这里可以保存到数据库或日志，这里只打印
    survey_data = schema.SurveyCreate(
        chatId=data["chat_id"],
        solved=data["solved"],
        comment=data["comment"] if "comment" in data else ""
    )
    survey = survey_crud.create(db, objIn=survey_data)
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return {"success": True}

@router.get("/api/survey/exist")
async def exist_survey(chatId: str, db: Session = Depends(get_db), current_org = Depends(verify_token)):
    survey = survey_crud.getByChatId(db, chatId)
    return len(survey) > 0

@router.get("/api/survey/{chatId}")
async def get_survey(chatId: str, db: Session = Depends(get_db), current_org = Depends(verify_token)):
    survey = survey_crud.getByChatId(db, chatId)
    return survey

@router.get("/api/contact_info")
async def get_contact_info(session_key: str = None, user_id: str = None, db: Session = Depends(get_db), current_org = Depends(verify_token)):
    return contact_crud.getAllContact(db)

