import axios from "axios";

// export const API_BASE_URL = "http://172.20.10.2:8000/api";
export const API_BASE_URL = "http://localhost:8000/api";
//解决跨域问题
axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*";
axios.defaults.headers.common["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
axios.defaults.headers.common["Access-Control-Allow-Headers"] = "Content-Type, Authorization";

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