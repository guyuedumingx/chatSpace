import axios from "axios";
import { API_BASE_URL } from "./index";


export const orgApi = {
    // 获取机构信息
  getOrgInfo: async (orgCode: string) => {
    const response = await axios.get(`${API_BASE_URL}/org/${orgCode}`);
    return response.data;
  },

    // 登录
  login: async (data: {orgCode: string, password: string, ehrNo: string, userName: string, phone: string}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // 服务器返回了错误响应
        throw new Error(error.response.data.detail || '登录失败');
      } else if (error.request) {
        // 请求发送失败
        throw new Error('网络连接失败，请检查网络设置');
      } else {
        // 其他错误
        throw new Error('登录失败，请稍后重试');
      }
    }
  },

    // 修改密码
  changePassword: async (orgCode: string, oldPassword: string, newPassword: string) => {
    const response = await axios.post(`${API_BASE_URL}/changePassword`, { orgCode, oldPassword, newPassword });
    return response.data;
  },
};
