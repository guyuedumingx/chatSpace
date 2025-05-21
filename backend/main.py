from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from admin_api import router as admin_router
from api_v1.base import router as base_router
from database.config import get_db, init_db
from database.init_data import init_all_data
from api_v1.auth import router as auth_router
from api_v1.survey import router as survey_router
from api_v1.chat import router as chat_router

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
app.include_router(base_router)
app.include_router(auth_router)
app.include_router(survey_router)
app.include_router(chat_router)

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