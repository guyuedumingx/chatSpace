from fastapi import FastAPI, Request, HTTPException, Depends, APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy.orm import Session

from database.config import get_db, init_db
import database.models as models
from database.crud import org, session as session_crud, chat, message, hot_topic
from database import schema
from database.init_data import init_all_data

from util import mask_sensitive
from security import create_access_token




# 创建路由器
router = APIRouter(prefix="/api")


sessions = [
    {
        "key": "default-0",
        "label": "业务咨询",
        "group": "今天",
    },
]

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

mock_message_history = {
    "default-0": [
    ]
}

# Mock data based on keywords
mock_keyword_responses = [
    {
        "id": "resp-account-open",
        "keywords": ["账户", "开户"],
        "response_content": "关于账户开户，您需要准备A、B、C材料，然后前往任一网点办理。详情请咨询您的客户经理。",
        "prompt_label": "如何办理对公账户开户？"
    },
    {
        "id": "resp-ebanking-setup",
        "keywords": ["网银", "企业网银", "开通"],
        "response_content": "企业网银可以通过我们的官方网站在线申请，或前往柜台由客户经理协助开通。具体流程请参考官网指南。",
        "prompt_label": "企业网银如何开通？"
    },
    {
        "id": "resp-loan-application",
        "keywords": ["贷款", "企业贷款"],
        "response_content": "企业贷款需要根据您的企业资质和经营情况进行评估，请联系您的客户经理或在线提交预审申请以获取更详细的信息。",
        "prompt_label": "如何申请企业贷款？"
    },
    {
        "id": "resp-transfer-limit",
        "keywords": ["限额", "转账限额"],
        "response_content": "对公账户的转账限额根据您的账户类型和签约服务有所不同。具体限额请查询您的服务协议或通过网银/手机银行查看。",
        "prompt_label": "对公转账限额是多少？"
    },
    {
        "id": "resp-password-generic",
        "keywords": ["密码"], # Generic keyword, might lead to prompts if other password keywords also match
        "response_content": "关于密码问题，请您提供更详细的信息，例如是登录密码、支付密码还是其他类型的密码问题？",
        "prompt_label": "密码相关通用咨询"
    },
    {
        "id": "resp-password-login-forgot",
        "keywords": ["登录密码", "忘记密码", "重置密码"],
        "response_content": "如果您忘记了登录密码，可以通过手机银行App或官方网站的忘记密码功能进行重置，通常需要验证您的注册手机号或预留信息。",
        "prompt_label": "忘记登录密码怎么办？"
    },
    {
        "id": "resp-password-payment",
        "keywords": ["支付密码", "交易密码"],
        "response_content": "支付密码用于交易验证。如果您遇到支付密码问题，如忘记或锁定，请联系客服或前往柜台处理。",
        "prompt_label": "支付密码相关问题"
    },
    {
        "id": "resp-product-wealth",
        "keywords": ["理财", "理财产品"],
        "response_content": "我们提供多种企业理财产品，包括不同期限和风险等级的选择。您可以咨询您的客户经理或访问我们的企业金融板块了解详情。",
        "prompt_label": "企业理财有哪些产品？"
    }
]

default_mock_response_content = "抱歉，我暂时无法理解您的问题。您可以尝试换一种问法，或者咨询人工客服。"

class ChatCompletionRequest(BaseModel):
    model: str
    messages: list[dict]
    stream: bool = False # Stream flag will be ignored for now but kept for compatibility

def generate_assistant_reply(user_content: str):
    user_content = user_content.lower()
    matched_responses = []

    for resp_data in mock_keyword_responses:
        if resp_data['prompt_label'] == user_content:
            matched_responses.append(resp_data)
            break

    if not matched_responses:
        for resp_data in mock_keyword_responses:
            for keyword in resp_data["keywords"]:
                if keyword.lower() in user_content:
                    matched_responses.append(resp_data)
                    break

    final_response_content = default_mock_response_content
    prompts_for_user = []
    if not matched_responses:
        pass
    elif len(matched_responses) == 1:
        final_response_content = matched_responses[0]["response_content"]
    else:
        final_response_content = "您可能想了解以下哪个问题？请选择或继续提问："
        unique_prompts_map = {item['id']: item for item in matched_responses}
        prompts_for_user = [
            {"key": item_id, "description": item_data["prompt_label"]}
            for item_id, item_data in unique_prompts_map.items()
        ]
    return final_response_content, prompts_for_user

@router.get("/sessions/{orgCode}")
async def get_sessions(orgCode: str, db: Session = Depends(get_db)):
    # 获取机构对应的会话
    db_session = session_crud.getByOrg(db, orgCode)
    if not db_session:
        return []
    
    # 获取会话中的所有聊天
    db_chats = chat.getBySession(db, db_session.sessionId)
    
    # 获取当前日期以进行比较
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    
    # 将数据库对象转换为前端所需格式，并根据日期分组
    sessions_list = []
    for db_chat in db_chats:
        chat_date = db_chat.createdAt.date()
        
        # 根据日期确定分组
        if chat_date == today:
            group = "今天"
        elif chat_date == yesterday:
            group = "昨天"
        else:
            group = "更早"
            
        session_item = {
            "key": db_chat.chatId,
            "label": db_chat.title or db_chat.chatName,
            "group": group
        }
        sessions_list.append(session_item)
    
    # 按照创建时间降序排序，使最新的聊天排在前面
    sessions_list.sort(key=lambda x: next((c.createdAt for c in db_chats if c.chatId == x["key"])), reverse=True)
    
    return sessions_list

@router.post("/sessions")
async def create_session(data: dict, db: Session = Depends(get_db)):
    orgCode = data.get("orgCode")
    chatName = data.get("label", f"业务咨询")
    
    # 获取组织
    db_org = org.getByOrgCode(db, orgCode)
    if not db_org:
        raise HTTPException(status_code=404, detail="机构不存在")
    
    # 检查组织是否已有会话
    db_session = session_crud.getByOrg(db, orgCode)
    
    # 如果没有会话，创建新会话
    if not db_session:
        session_data = schema.SessionCreate(orgCode=orgCode)
        db_session = session_crud.create(db, objIn=session_data)
    
    # 创建新的聊天
    chat_data = schema.ChatCreate(
        sessionId=db_session.sessionId,
        chatName=chatName,
        title=data.get("title")
    )
    db_chat = chat.create(db, objIn=chat_data)
    
    # 返回新创建的聊天信息
    return {
        "key": db_chat.chatId,
        "label": db_chat.title or db_chat.chatName,
        "group": "今天"
    }

@router.delete("/sessions/{key}")
async def delete_session(key: str, db: Session = Depends(get_db)):
    # 获取聊天记录
    db_chat = chat.getByChatId(db, key)
    if not db_chat:
        return {"message": "Chat not found or already deleted"}
    
    # 删除聊天记录
    chat.remove(db, id=db_chat.id)
    
    return {"message": "Chat deleted successfully"}


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

@router.get("/message_history/{key}")
async def get_message_history(key: str, db: Session = Depends(get_db)):
    # 获取聊天记录
    db_chat = chat.getByChatId(db, key)
    if not db_chat:
        return []
    
    # 获取聊天的所有消息
    db_messages = message.getByChat(db, key)
    
    # 转换为前端所需格式
    message_history = []
    for msg in db_messages:
        message_item = {
            "id": msg.messageId,
            "role": msg.sender,
            "content": msg.content,
            "status": msg.status
        }
        message_history.append(message_item)
    
    return message_history

@router.post("/message_history/{key}")
async def save_message_history(key: str, message_data: dict, db: Session = Depends(get_db)):
    # 获取聊天记录
    db_chat = chat.getByChatId(db, key)
    if not db_chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # 创建用户消息
    user_content = mask_sensitive(message_data.get("content", ""))
    now = datetime.now()
    user_message_data = {
        "content": user_content,
        "role": "user",
        "status": "sent",
        "id": f"msg_{int(now.timestamp()*1000)}"
    }
    
    # 保存用户消息到数据库
    user_db_message = models.Message(
        chatId=key,
        content=user_content,
        sender="user",
        status="sent",
        timestamp=now
    )
    db.add(user_db_message)
    db.commit()
    db.refresh(user_db_message)
    
    # 生成助手回复
    assistant_content, prompts = generate_assistant_reply(user_content)
    
    # 创建助手消息
    assistant_db_message = models.Message(
        chatId=key,
        content=assistant_content,
        sender="assistant",
        status="received",
        timestamp=datetime.now()
    )
    db.add(assistant_db_message)
    db.commit()
    db.refresh(assistant_db_message)
    
    # 转换为前端所需格式
    assistant_msg = {
        "id": assistant_db_message.messageId,
        "role": "assistant",
        "content": assistant_content,
        "status": "received"
    }
    
    # 如果有推荐问题，添加到响应中
    if prompts:
        assistant_msg["custom_prompts"] = prompts
    
    return assistant_msg

# 假设每个会话或用户有固定联系人
mock_contacts = {
    "default-0": {"contactName": "张三", "contactPhone": "13888888888"},
    # 可以添加更多会话key或user_id对应的联系人
}

@router.post("/survey")
async def submit_survey(data: dict):
    # data: {solved: 'yes'|'no', comment: str, session_key: str, user_id: str (可选)}
    # 这里可以保存到数据库或日志，这里只打印
    print("收到满意度调查：", data)
    return {"success": True}

@router.get("/contact_info")
async def get_contact_info(session_key: str = None, user_id: str = None):
    # 优先用session_key查找联系人
    if session_key and session_key in mock_contacts:
        return mock_contacts[session_key]
    # 也可以根据user_id查找
    # if user_id and user_id in mock_contacts:
    #     return mock_contacts[user_id]
    # 默认返回第一个
    return list(mock_contacts.values())[0]

# mock用户数据
mock_users = [
    {
        "orgCode": "36909",
        "ehrNo": "0492555",
        "phone": "13800001111",
        "password": "123456",
        "userName": "张三",
        "orgName": "集约运营中心（广东）",
        "isFirstLogin": True,
        "lastPasswordChangeTime": "2025-01-01"
    },
    # 可添加更多用户
]

@router.post("/login")
async def login(data: dict, db: Session = Depends(get_db)):
    orgCode = data.get("orgCode")
    password = data.get("password")
    
    # 从数据库中获取组织
    db_org = org.getByOrgCode(db, orgCode)
    if not db_org or db_org.password != password:
        raise HTTPException(status_code=401, detail="机构号或密码错误")
    
    # 检查是否是第一次登录
    isFirstLogin = db_org.isFirstLogin
    
    # 如果是第一次登录，更新状态
    if isFirstLogin:
        db_org.isFirstLogin = False
        db.add(db_org)
        db.commit()
        db.refresh(db_org)
    
    # 返回登录信息（不需要修改isFirstLogin，因为前端需要知道这是第一次登录）
    return {
        "token": create_access_token(data={"sub": db_org.orgCode}),
        "orgCode": db_org.orgCode,
        "orgName": db_org.orgName,
        "isFirstLogin": isFirstLogin,  # 返回登录前的状态，以便前端判断是否需要修改密码
        "lastPasswordChangeTime": db_org.passwordLastChanged.isoformat()
    }

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

@router.post("/changePassword")
async def change_password(data: dict, db: Session = Depends(get_db)):
    orgCode = data.get("orgCode")
    oldPassword = data.get("oldPassword")
    newPassword = data.get("newPassword")
    
    # 验证旧密码
    db_org = org.getByOrgCode(db, orgCode)
    if not db_org or db_org.password != oldPassword:
        raise HTTPException(status_code=401, detail="机构号或旧密码错误")
    
    # 更新密码
    updated_org = org.changePassword(db, orgCode, newPassword)
    
    return {"success": True}

if __name__ == "__main__":
    uvicorn.run("api:router", host="0.0.0.0", port=8000)