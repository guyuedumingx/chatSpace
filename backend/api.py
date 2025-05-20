from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi import APIRouter
from util import mask_sensitive
from security import create_access_token


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
async def get_sessions(orgCode: str):
    return sessions

@router.post("/sessions/{orgCode}")
async def create_session(orgCode: str, data: dict):
    session_id = f"session-{len(sessions)}-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    session = {
        "key": session_id,
        "label": data.get("label", f"业务咨询 {len(sessions) + 1}"),
        "group": "今天", # Or determine group dynamically
    }
    mock_message_history[session["key"]] = []
    sessions.insert(0, session) # Insert new sessions at the beginning
    return session

@router.delete("/sessions/{key}")
async def delete_session(key: str):
    global sessions # Ensure we are modifying the global list
    original_len = len(sessions)
    sessions = [s for s in sessions if s["key"] != key]
    if key in mock_message_history:
        del mock_message_history[key]
    
    if len(sessions) < original_len:
        return {"message": "Session deleted successfully"}
    else:
        # Consider returning a 404 if the key was not found, though current behavior is to silently succeed.
        return {"message": "Session not found or already deleted"}


@router.get("/hot_topics")
async def get_hot_topics():
    return mock_hot_topics

@router.get("/message_history/{key}")
async def get_message_history(key: str):
    # 返回完整历史，格式为[{id, role, content, custom_prompts?}, ...]
    return mock_message_history.get(key, [])

@router.post("/message_history/{key}")
async def save_message_history(key: str, message: dict):
    user_msg = {
        "id": f"msg_{int(datetime.now().timestamp()*1000)}",
        "role": "user",
        "content": mask_sensitive(message.get("content", ""))
    }
    if key not in mock_message_history:
        mock_message_history[key] = []
    mock_message_history[key].append(user_msg)
    # 生成assistant回复
    final_response_content, prompts_for_user = generate_assistant_reply(message.get("content", ""))
    assistant_msg = {
        "id": f"msg_{int(datetime.now().timestamp()*1000)+1}",
        "role": "assistant",
        "content": final_response_content
    }
    if prompts_for_user:
        assistant_msg["custom_prompts"] = prompts_for_user
    mock_message_history[key].append(assistant_msg)
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
async def login(data: dict):
    # 简单的登录验证，实际环境中应做更强的安全措施
    org_code = data.get("orgCode")
    password = data.get("password")
    
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
            "userName": user["userName"],
            "isFirstLogin": user["isFirstLogin"],
            "lastPasswordChangeTime": user["lastPasswordChangeTime"]
        }
    }

@router.get("/org/{orgCode}")
async def get_org_info(orgCode: str):
    for user in mock_users:
        if user["orgCode"] == orgCode:
            return {
                "orgName": user["orgName"],
                "isFirstLogin": user["isFirstLogin"],
                "lastPasswordChangeTime": user["lastPasswordChangeTime"]
            }
    raise HTTPException(status_code=404, detail="机构号不存在")

@router.post("/changePassword")
async def change_password(data: dict):
    orgCode = data.get("orgCode")
    oldPassword = data.get("oldPassword")
    newPassword = data.get("newPassword")
    for user in mock_users:
        if user["orgCode"] == orgCode and user["password"] == oldPassword:
            user["password"] = newPassword
            user["lastPasswordChangeTime"] = datetime.now().strftime("%Y-%m-%d")
            return {"success": True}
    raise HTTPException(status_code=401, detail="机构号、旧密码或新密码错误")

if __name__ == "__main__":
    uvicorn.run("api:router", host="0.0.0.0", port=8000)