import axios from 'axios';
import type { ConversationData, ConversationDetailResponse } from '../types/conversation';

// 分页查询参数接口
interface QueryParams {
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  searchTerm?: string;
  solvedFilter?: string;
}

// 分页数据响应接口
interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 对话记录相关接口
export const conversationApi = {
  // 获取对话列表
  getConversations: async (params: QueryParams): Promise<PagedResponse<ConversationData>> => {
    const response = await axios.get('/admin/conversation/conversations', { params });
    return response.data;
  },

  // 获取对话详情
  getConversationDetail: async (conversationId: string): Promise<ConversationDetailResponse> => {
    const response = await axios.get(`/admin/conversation/conversations/${conversationId}`);
    return response.data;
  },

  // 获取网点层级结构
  getBranchOptions: async () => {
    const response = await axios.get('/admin/conversation/branch_options');
    return response.data;
  },
};


