from fastapi import HTTPException, Depends, APIRouter
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database.config import get_db
from database.crud import org, session as session_crud, chat
from security import create_access_token, get_password_hash, verify_password
from database.schema import SessionCreate, ChatCreate

# 创建路由器
router = APIRouter()

@router.post("/api/login")
async def login(data: dict, db: Session = Depends(get_db)):
    orgCode = data.get("orgCode")
    password = data.get("password")
    
    # 从数据库中获取组织
    db_org = org.getByOrgCode(db, orgCode)
    if not db_org or not verify_password(password, db_org.password):
        raise HTTPException(status_code=401, detail="机构号或密码错误")
    
    # 检查是否是第一次登录
    isFirstLogin = db_org.isFirstLogin
    
    # 如果是第一次登录，更新状态
    if isFirstLogin:
        db_org.isFirstLogin = False

        # 检查组织是否已有会话
        db_session = session_crud.getByOrg(db, orgCode)
        
        # 如果没有会话，创建新会话
        if not db_session:
            session_data = SessionCreate(orgCode=orgCode)
            db_session = session_crud.create(db, objIn=session_data)
        
        # 创建新的聊天
        chat_data = ChatCreate(
            sessionId=db_session.sessionId,
            chatName="业务咨询",
        )
        db_chat = chat.create(db, objIn=chat_data)
        db.add(db_org)
        db.commit()
        db.refresh(db_org)
    
    return {
        "token": create_access_token(data={"sub": db_org.orgCode}),
        "orgCode": db_org.orgCode,
        "orgName": db_org.orgName,
        "isFirstLogin": isFirstLogin,  # 返回登录前的状态，以便前端判断是否需要修改密码
        "lastPasswordChangeTime": db_org.passwordLastChanged.isoformat()
    }

@router.post("/api/changePassword")
async def change_password(data: dict, db: Session = Depends(get_db)):
    orgCode = data.get("orgCode")
    oldPassword = data.get("oldPassword")
    newPassword = data.get("newPassword")
    
    # 验证旧密码
    db_org = org.getByOrgCode(db, orgCode)
    if not db_org or not verify_password(oldPassword, db_org.password):
        raise HTTPException(status_code=401, detail="机构号或旧密码错误")
    
    # 更新密码
    updated_org = org.changePassword(db, orgCode, get_password_hash(newPassword))
    if not updated_org:
        raise HTTPException(status_code=401, detail="密码更新失败")
    
    return {"success": True}


mock_users = [
    {
        "orgCode": "36909",
        "orgName": "集约运营中心（广东）",
        "password": "123456"
    }
]

@router.post("/api/admin/login")
async def admin_login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # 简单的登录验证，实际环境中应做更强的安全措施
    org_code = form_data.username
    password = form_data.password
    
    # 查找用户
    user = next((u for u in mock_users if u["orgCode"] == org_code), None)
    if not user or user["password"] != password:
        raise HTTPException(
            status_code=401, 
            detail="无效的机构号或密码"
        )
    
    # 生成token
    access_token = create_access_token({"sub": org_code})
    
    # 返回登录信息
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "orgCode": user["orgCode"],
            "orgName": user["orgName"],
            "role": "admin"
        }
    }