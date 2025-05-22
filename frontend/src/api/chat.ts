import axios from "axios";
import { API_BASE_URL } from "./index";

//解决跨域问题
axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*";

export interface ChatResponse {
  response: string;
}

export interface Message {
  role: string;
  content: string;
  custom_prompts?: Array<{
    key: string;
    description: string;
  }>;
}

// 前端使用的消息历史项结构
export interface MessageHistoryItem {
  id: string;
  message: Message;
  status: 'success' | 'loading' | 'error';
}

// 后端期望的消息格式
export interface BackendMessageItem {
  id: string;
  role: string;
  content: string;
  custom_prompts?: Array<{
    key: string;
    description: string;
  }>;
}

export interface ContactInfo {
  contactName: string;
  contactPhone: string;
  order: number;
}

export interface SurveyData {
  solved: 'yes' | 'no';
  comment?: string;
  chat_id: string;
  user_id?: string;
}

export const sendMessage = async (message: string): Promise<ChatResponse> => {
  const response = await axios.post(`${API_BASE_URL}/chat`, { message });
  return response.data;
};

export const chatApi = {
  // 获取会话列表
  getConversations: async (orgCode: string) => {
    const response = await axios.get(`${API_BASE_URL}/chat/${orgCode}`);
    return response.data;
  },

  // 创建新会话
  createConversation: async (name: string, orgCode: string) => {
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      label: name,
      orgCode: orgCode
    });
    return response.data;
  },

  // 删除会话
  deleteConversation: async (key: string) => {
    const response = await axios.delete(`${API_BASE_URL}/chat/${key}`);
    return response.data;
  },

  // 获取热点问题
  getHotTopics: async () => {
    const response = await axios.get(`${API_BASE_URL}/hot_topics`);
    return response.data;
  },

  // 获取消息历史
  getMessageHistory: async (conversationKey: string) => {
    const response = await axios.get(`${API_BASE_URL}/message_history/${conversationKey}`);
    return response.data;
  },

  // 新增：发送一条用户消息到历史
  sendMessageToHistory: async (conversationKey: string, userMessage: string) => {
    const response = await axios.post(`${API_BASE_URL}/message_history/${conversationKey}`, {
      role: 'user',
      content: userMessage
    });
    return response.data;
  },

  // 获取业务联系人信息
  getContactInfo: async (sessionKey: string): Promise<ContactInfo> => {
    const response = await axios.get(`${API_BASE_URL}/contact_info?session_key=${sessionKey}`);
    return response.data;
  },

  // 提交满意度调查
  submitSurvey: async (data: SurveyData) => {
    const response = await axios.post(`${API_BASE_URL}/survey`, data);
    return response.data;
  },
};
