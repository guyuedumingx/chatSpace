import { create } from 'zustand';
import { orgApi } from '@/api/org';

interface LoginData {
  orgCode: string;
  password: string;
  ehrNo: string;
  userName: string;
  phone: string;
}

export interface OrgState {
  orgCode: string;
  orgName: string;
  isFirstLogin: boolean;
  token: string;
  lastPasswordChangeTime: string;
  login: (data: LoginData) => Promise<[boolean, any]>;
  logout: () => void;
  setOrgStore: (state: Partial<OrgState>) => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  orgCode: localStorage.getItem('orgCode') || '',
  orgName: localStorage.getItem('orgName') || '',
  isFirstLogin: localStorage.getItem('isFirstLogin') === 'true' || false,
  token: localStorage.getItem('token') || '',
  lastPasswordChangeTime: localStorage.getItem('lastPasswordChangeTime') || '',
  login: async (data: LoginData) => {
    try {
      const res = await orgApi.login(data);
      if (!res.success) {
        return [false, null];
      }
      localStorage.setItem('token', res.token);
      localStorage.setItem('orgCode', res.orgCode);
      localStorage.setItem('orgName', res.orgName);
      localStorage.setItem('isFirstLogin', res.isFirstLogin);
      localStorage.setItem('lastPasswordChangeTime', res.lastPasswordChangeTime);
      set({ orgCode: res.orgCode, orgName: res.orgName, isFirstLogin: res.isFirstLogin, token: res.token, lastPasswordChangeTime: res.lastPasswordChangeTime });
      return [res.success, res];
    } catch {
      return [false, null];
    }
  },



  logout: () => {
    set({ orgCode: '', orgName: '', token: ''});
    localStorage.removeItem('token');
  },

  setOrgStore: (newState: Partial<OrgState>) => {    //设置机构状态
    set((state: OrgState) => ({ 
      ...state,
      ...newState
    }));
  }
})); 