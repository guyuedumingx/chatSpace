from datetime import datetime, timedelta
from typing import Any, Optional, Union, Dict

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

# OAuth2密码流依赖
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    创建JWT访问令牌
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    获取密码哈希
    """
    return pwd_context.hash(password)


async def verify_token(token: str = Depends(oauth2_scheme)):
    """
    验证访问令牌并返回当前用户
    """
    credentials_exception = HTTPException(
        status_code=401,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        org_code: str = payload.get("sub")
        if org_code is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # 在生产环境中，这里应该查询数据库验证用户是否存在
    # 这里简化处理，只要令牌有效就接受请求
    return {"orgCode": org_code} 