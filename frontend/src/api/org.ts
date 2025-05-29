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
      const response = await axios.post(`${API_BASE_URL}/login`, data);
      return response.data;
  },

    // 修改密码
  changePassword: async (orgCode: string, oldPassword: string, newPassword: string) => {
    const response = await axios.post(`${API_BASE_URL}/changePassword`, { orgCode, oldPassword, newPassword });
    return response.data;
  },
};
