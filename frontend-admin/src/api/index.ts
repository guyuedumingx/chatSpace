import axios from 'axios';
import type { PaginationParams } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// 设置全局axios默认值
axios.defaults.baseURL = API_BASE_URL;

// 请求拦截器，添加token
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器，处理token过期等情况
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API请求失败:', error);
    if (error.response) {
      if (error.response.status === 401) {
        // token过期或无效，清除本地存储并跳转到登录页
        console.log('认证失败，跳转到登录页');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (error.response.status === 403) {
        console.error('权限不足');
      } else {
        console.error('请求失败:', error.response.status, error.response.data);
      }
    } else if (error.request) {
      console.error('未收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

// 登录
export const login = (orgCode: string, password: string) => {
  return axios.post('/admin/login', { orgCode, password });
};

// 修改密码
export const changePassword = (oldPassword: string, newPassword: string) => {
  return axios.post('/changePassword', { oldPassword, newPassword });
};

// 获取仪表盘数据
export const getDashboardData = () => {
  return axios.get('/admin/dashboard');
};

// 获取所有机构数据
export const getBranchesData = (params?: Partial<PaginationParams>) => {
  return axios.get('/admin/branches', { params });
};

// 获取机构详情
export const getBranchDetail = (orgCode: string) => {
  return axios.get(`/admin/branches/${orgCode}`);
};

// 获取对话记录列表
export const getConversations = (params?: Partial<PaginationParams>) => {
  return axios.get('/admin/conversations', { params });
};

// 获取对话详情
export const getConversationDetail = (id: string) => {
  return axios.get(`/admin/conversations/${id}`);
};

// 获取满意度调查数据
export const getSurveysData = (params?: Partial<PaginationParams>) => {
  return axios.get('/admin/surveys', { params });
};

// 获取满意度调查详情
export const getSurveyDetail = (id: string) => {
  return axios.get(`/admin/surveys/${id}`);
};

// 导出数据
export const exportData = (type: string, params?: Partial<PaginationParams>) => {
  return axios.get(`/admin/export/${type}`, {
    params,
    responseType: 'blob'
  });
}; 