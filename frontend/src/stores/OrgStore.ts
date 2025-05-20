import { create } from 'zustand';
import { orgApi } from '@/api/org';

interface LoginData {
  orgCode: string;
  password: string;
  ehrNo: string;
  userName: string;
  phone: string;
}

interface OrgState {
  orgCode: string;
  orgName: string;
  isFirstLogin: boolean;
  token: string;
  lastPasswordChangeTime: string;
  login: (data: LoginData) => Promise<any>;
  logout: () => void;
  setOrgStore: (state: Partial<OrgState>) => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  orgCode: '',
  orgName: '',
  isFirstLogin: false,
  token: localStorage.getItem('token') || '',
  lastPasswordChangeTime: '',
  login: async (data: LoginData) => {
    const res = await orgApi.login(data);
    localStorage.setItem('token', res.token);
    set({ orgCode: res.orgCode, orgName: res.orgName, isFirstLogin: true, token: res.token, lastPasswordChangeTime: res.lastPasswordChangeTime });
    return res;
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