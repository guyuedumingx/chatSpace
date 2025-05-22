import axios from 'axios';
import type { PaginationParams } from '../types';

export interface QuestionData {
  id: string;
  key: string;
  importDate: string;
  entryCode: string;
  onlineCode: string;
  questionType: string;
  questionDescription: string;
  operationGuide: string;
  remark: string;
  keywords: string[];
}

export interface QuestionListResponse {
  data: QuestionData[];
  total: number;
  page: number;
  pageSize: number;
}

// 获取问题列表
export async function getQuestions(params: PaginationParams & {
  searchText?: string;
  questionType?: string;
}): Promise<QuestionListResponse> {
  const apiParams = {
    page: params.page,
    page_size: params.pageSize,
    search_text: params.searchText,
    question_type: params.questionType
  };
  
  const response = await axios.get('/admin/questionbank/questions', { 
    params: apiParams 
  });
  
  // 从响应头中获取总数
  const total = parseInt(response.headers['x-total-count'] || '0', 10);
  
  return {
    data: response.data,
    total: total,
    page: params.page || 1,
    pageSize: params.pageSize || 10
  };
}

// 创建问题
export async function createQuestion(data: Omit<QuestionData, 'id' | 'key' | 'importDate'>) {
  const response = await axios.post('/admin/questionbank/questions', data);
  return response.data;
}

// 更新问题
export async function updateQuestion(id: string, data: Omit<QuestionData, 'id' | 'key' | 'importDate'>) {
  const response = await axios.put(`/admin/questionbank/questions/${id}`, data);
  return response.data;
}

// 删除问题
export async function deleteQuestion(id: string) {
  const response = await axios.delete(`/admin/questionbank/questions/${id}`);
  return response.data;
}

// 导入Excel
export async function importQuestions(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post('/admin/questionbank/questions/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}
