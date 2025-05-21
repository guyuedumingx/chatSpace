from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from admin_api import router as admin_router
from api import router as api_router
from database.config import get_db, init_db
from database.config import get_db, init_db
import database.models as models
from database.crud import org, session as session_crud, chat, message, hot_topic
from database import schema
from database.init_data import init_all_data

app = FastAPI()

# 初始化数据库
init_db()

# 启动事件：初始化数据
@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    init_all_data(db)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册管理API路由
app.include_router(admin_router)
app.include_router(api_router)

# # Initialize chatbot
# chatbot = QwenChatbot()

# class ChatRequest(BaseModel):
#     message: str

# class ChatResponse(BaseModel):
#     response: str

# @app.post("/api/chat", response_model=ChatResponse)
# async def chat(request: ChatRequest):
#     try:
#         response = chatbot.generate_response(request.message)
#         return ChatResponse(response=response)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 