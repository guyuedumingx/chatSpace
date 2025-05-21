// frontend-admin/src/types/conversation.ts
export interface ConversationData {
    id: string;
    time: string;
    branchId: string;
    branch: string;
    topic: string;
    messages: number;
    duration: string;
    status: 'active' | 'ended' | 'timeout';
    satisfaction?: {
      solved: 'yes' | 'no';
      comment?: string;
      timestamp: string;
    };
  }
  
  export interface MessageData {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }
  
  export interface ConversationResponse {
    data: ConversationData[];
    total: number;
    page: number;
    pageSize: number;
  }
  
  export interface ConversationDetailResponse {
    id: string;
    orgCode: string;
    orgName: string;
    startTime: string;
    endTime: string;
    messages: MessageData[];
    status: string;
    hasSurvey: boolean;
    survey?: {
      solved: 'yes' | 'no';
      comment?: string;
      timestamp: string;
    };
  }

// 会话类型
export interface Session {
  session_id: string;
  org_code: string;
  created_at: string;
  chats: Chat[];
}

// 对话类型
export interface Chat {
  chat_id: string;
  session_id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

// 消息类型
export interface Message {
  message_id: string;
  chat_id: string;
  content: string;
  sender: string;
  timestamp: string;
  status: string;
}

// API响应类型
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

// 分页请求参数
export interface PaginationParams {
  skip: number;
  limit: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}