from fastapi import HTTPException, Depends, APIRouter
from database.config import get_db
from database.crud import chat, message, session as session_crud, org
from database import schema, models
from datetime import datetime, timedelta
from util import mask_sensitive
from sqlalchemy.orm import Session

router = APIRouter()

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


@router.post("/api/message_history/{key}")
async def save_message_history(key: str, message_data: dict, db: Session = Depends(get_db)):
    # 获取聊天记录
    db_chat = chat.getByChatId(db, key)
    if not db_chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # 创建用户消息
    user_content = mask_sensitive(message_data.get("content", ""))
    now = datetime.now()
    
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


@router.get("/api/message_history/{key}")
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

@router.get("/api/chat/{orgCode}")
async def get_chats(orgCode: str, db: Session = Depends(get_db)):
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

@router.post("/api/chat")
async def create_chat(data: dict, db: Session = Depends(get_db)):
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

@router.delete("/api/chat/{key}")
async def delete_chat(key: str, db: Session = Depends(get_db)):
    # 获取聊天记录
    db_chat = chat.getByChatId(db, key)
    if not db_chat:
        return {"message": "Chat not found or already deleted"}
    
    #TODO 标记删除聊天记录
    db_chat.isDeleted = True
    db.commit()
    db.refresh(db_chat)
    
    return {"message": "Chat deleted successfully"}
