from database.models import Org
from database.crud import org as org_crud
from database.config import get_db
from security import verify_token
from fastapi import Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from fastapi import APIRouter
from database.schema import OrgUpdate
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
from security import get_password_hash

router = APIRouter(tags=["org"])

@router.get("/list")
async def get_org_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    keyword: Optional[str] = None,
    current_user = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    获取网点列表
    可选参数:
    - page: 页码
    - pageSize: 每页数量
    - keyword: 搜索关键词
    """
    # 获取机构列表
    orgs = org_crud.get_org_list(db, pageSize, pageSize * (page - 1))
    
    # 搜索处理
    if keyword:
        orgs = [org for org in orgs if keyword.lower() in org.orgName.lower() or keyword in org.orgCode]
    
    # 转换为字典列表以便序列化
    result = []
    for org in orgs:
        org_dict = {
            "id": org.id,
            "orgCode": org.orgCode,
            "orgName": org.orgName,
            "contactPhone": org.contactPhone,
            "contactName": org.contactName,
            "contactEhr": org.contactEhr,
            "isFirstLogin": org.isFirstLogin,
            "passwordLastChanged": org.passwordLastChanged.isoformat() if org.passwordLastChanged else None
        }
        result.append(org_dict)
    
    return result

@router.get("/detail/{org_code}")
async def get_org_detail(
    org_code: str,
    current_user = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    获取网点详情
    """
    org = org_crud.getByOrgCode(db, org_code)
    if not org:
        raise HTTPException(status_code=404, detail=f"网点 {org_code} 不存在")
    
    # 转换为字典
    org_dict = {
        "id": org.id,
        "orgCode": org.orgCode,
        "orgName": org.orgName,
        "contactPhone": org.contactPhone,
        "contactName": org.contactName,
        "contactEhr": org.contactEhr,
        "isFirstLogin": org.isFirstLogin,
        "passwordLastChanged": org.passwordLastChanged.isoformat() if org.passwordLastChanged else None
    }
    
    return org_dict

@router.put("/update")
async def update_org(
    org_data: OrgUpdate,
    current_user = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    更新网点信息
    """
    org = org_crud.getByOrgCode(db, org_data.orgCode)
    if not org:
        raise HTTPException(status_code=404, detail=f"网点 {org_data.orgCode} 不存在")
    
    # 更新组织信息
    update_data = {k: v for k, v in org_data.dict().items() if v is not None}
    org_crud.update(db, dbObj=org, objIn=update_data)
    
    return {"message": "网点信息更新成功"}

class ResetPassword(BaseModel):
    orgCode: str
    password: str

@router.post("/reset-password")
async def reset_password(reset_password: ResetPassword, current_user = Depends(verify_token), db: Session = Depends(get_db)):
    org = org_crud.getByOrgCode(db, reset_password.orgCode)
    if not org:
        raise HTTPException(status_code=404, detail=f"网点 {reset_password.orgCode} 不存在")
    
    org.password = get_password_hash(reset_password.password)
    org.passwordLastChanged = datetime.now()
    org.isFirstLogin = True 
    db.commit()
    return {"message": "密码重置成功"}