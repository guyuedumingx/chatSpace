import axios from 'axios';
import type { ConversationData } from '../types/conversation';

const API_BASE_URL = 'http://localhost:8000/api/admin';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器：添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 对话记录相关接口
export const conversationApi = {
  // 获取对话列表
  getConversations: async (params: {
    page: number;
    pageSize: number;
    startDate?: string;
    endDate?: string;
    orgCode?: string;
    keyword?: string;
  }) => {
    const response = await api.get('/conversations', { params });
    return response.data;
  },

  // 获取对话详情
  getConversationDetail: async (conversationId: string) => {
    const response = await api.get(`/conversations/${conversationId}`);
    return response.data;
  },

  // 获取满意度调查
  getSurveys: async (params: {
    page: number;
    pageSize: number;
    startDate?: string;
    endDate?: string;
    orgCode?: string;
    solved?: string;
  }) => {
    const response = await api.get('/surveys', { params });
    return response.data;
  },
};


