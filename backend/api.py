from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# 解决跨域问题
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        {
            "id": "msg_1",
            "message": {
                "role": "user",
                "content": "你好，我想办理对公账户开户。",
            },
            "status": "success",
        }
    ]
}

# SILICONFLOW_API_KEY = "sk-ravoadhrquyrkvaqsgyeufqdgphwxfheifujmaoscudjgldr" # Commented out
# SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/chat/completions" # Commented out

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

@app.post("/api/chat/completions")
async def chat_completions(chat_request: ChatCompletionRequest, request: Request):
    """
    Returns mock chat completion data based on keywords in the user's message.
    If multiple keywords/responses match, it returns a list of prompts.
    Stream flag is currently ignored, always returns a non-streaming JSON response.
    """
    user_message = ""
    if chat_request.messages and len(chat_request.messages) > 0:
        # Get the last user message
        for msg in reversed(chat_request.messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "").lower()
                break
    
    matched_responses = []
    if user_message:
        for resp_data in mock_keyword_responses:
            for keyword in resp_data["keywords"]:
                if keyword.lower() in user_message:
                    matched_responses.append(resp_data)
                    break # Move to next response_data once a keyword from it matches
    
    final_response_content = default_mock_response_content
    prompts_for_user = []

    if not matched_responses:
        # No keyword match, use default response
        pass # final_response_content is already set to default
    elif len(matched_responses) == 1:
        # Single unique match
        final_response_content = matched_responses[0]["response_content"]
    else:
        # Multiple matches, prepare prompts
        final_response_content = "您可能想了解以下哪个问题？请选择或继续提问："
        # Deduplicate prompts based on id (if an item matched on multiple keywords from its list)
        # and then extract prompt_label
        unique_prompts_map = {item['id']: item for item in matched_responses}
        prompts_for_user = [
            {"key": item_id, "description": item_data["prompt_label"]}
            for item_id, item_data in unique_prompts_map.items()
        ]

    # Construct the OpenAI-like response structure
    response_payload = {
        "id": f"chatcmpl-mock-{int(datetime.now().timestamp())}",
        "object": "chat.completion",
        "created": int(datetime.now().timestamp()),
        "model": chat_request.model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": final_response_content,
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 0, 
            "completion_tokens": 0,
            "total_tokens": 0
        }
    }

    if prompts_for_user:
        # Add prompts to the message if they exist
        # This is a custom field, frontend needs to handle it
        response_payload["choices"][0]["message"]["custom_prompts"] = prompts_for_user

    return response_payload

@app.get("/api/sessions")
async def get_sessions():
    return sessions

@app.post("/api/sessions")
async def create_session(data: dict):
    session_id = f"session-{len(sessions)}-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    session = {
        "key": session_id,
        "label": data.get("label", f"业务咨询 {len(sessions) + 1}"),
        "group": "今天", # Or determine group dynamically
    }
    mock_message_history[session["key"]] = []
    sessions.insert(0, session) # Insert new sessions at the beginning
    return session

@app.delete("/api/sessions/{key}")
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


@app.get("/api/hot_topics")
async def get_hot_topics():
    return mock_hot_topics

@app.get("/api/message_history/{key}")
async def get_message_history(key: str):
    return mock_message_history.get(key, []) # Return empty list if key doesn't exist

@app.post("/api/message_history/{key}")
async def save_message_history(key: str, messages: list[dict]): # Changed from 'message: dict' to 'messages: list[dict]'
    # This endpoint should probably replace the entire history for the key,
    # or append if that's the desired behavior.
    # Frontend's saveMessageHistory seems to send the whole array.
    mock_message_history[key] = messages
    return {"message": "Message history saved successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)