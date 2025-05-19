import axios from "axios";

export const API_BASE_URL = "http://localhost:8000/api";
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

export const sendMessage = async (message: string): Promise<ChatResponse> => {
  const response = await axios.post(`${API_BASE_URL}/chat`, { message });
  return response.data;
};

export const chatApi = {
  // 获取会话列表
  getConversations: async () => {
    const response = await axios.get(`${API_BASE_URL}/sessions`);
    return response.data;
  },

  // 创建新会话
  createConversation: async (name: string) => {
    const response = await axios.post(`${API_BASE_URL}/sessions`, {
      label: name,
    });
    return response.data;
  },

  // 删除会话
  deleteConversation: async (key: string) => {
    const response = await axios.delete(`${API_BASE_URL}/sessions/${key}`);
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
    console.log(response.data)
    return response.data;
  },

  // 保存消息历史，转换为后端期望的格式
  saveMessageHistory: async (conversationKey: string, messages: MessageHistoryItem[]) => {
    // 将前端的MessageHistoryItem转换为后端期望的格式
    const backendMessages = messages.map(msg => ({
      id: String(msg.id),
      role: msg.message.role,
      content: msg.message.content,
      ...(msg.message.custom_prompts ? { custom_prompts: msg.message.custom_prompts } : {})
    }));
    const response = await axios.post(`${API_BASE_URL}/message_history/${conversationKey}`, backendMessages);
    return response.data;
  },
};
