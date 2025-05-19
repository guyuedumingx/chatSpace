from fastapi import FastAPI
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


@app.get("/api/sessions")
async def get_sessions():
    return sessions

@app.post("/api/sessions")
async def create_session(data: dict):
    session = {
        "key": f"default-{len(sessions)}",
        "label": data["label"],
        "group": "今天",
    }
    mock_message_history[session["key"]] = []
    sessions.append(session)
    return session

@app.delete("/api/sessions/{key}")
async def delete_session(key: str):
    sessions.remove(key)
    return {"message": "Session deleted successfully"}

@app.get("/api/hot_topics")
async def get_hot_topics():
    return mock_hot_topics

@app.get("/api/message_history/{key}")
async def get_message_history(key: str):
    return mock_message_history[key]

@app.post("/api/message_history/{key}")
async def create_message_history(key: str, message: dict):
    mock_message_history[key].append(message)
    return mock_message_history[key]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)