import { create } from 'zustand';

interface OrgState {
  orgCode: string;
  orgName: string;
  isLoggedIn: boolean;
  login: (orgCode: string, password: string) => Promise<boolean>;
  logout: () => void;
  setOrgStore: (state: Partial<OrgState>) => void;
}

// 模拟机构数据
const MOCK_ORGS = [
  { orgCode: '36909', orgName: '北京分行', password: '123456' },
  { orgCode: '36910', orgName: '上海分行', password: '123456' },
];

export const useOrgStore = create<OrgState>((set: any) => ({
  orgCode: '',
  orgName: '',
  isLoggedIn: false,

  login: async (orgCode: string, password: string) => {
    // 模拟登录请求
    return new Promise((resolve) => {
      setTimeout(() => {
        const org = MOCK_ORGS.find(o => o.orgCode === orgCode && o.password === password);
        if (org) {
          set({ orgCode: org.orgCode, orgName: org.orgName, isLoggedIn: true });
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  },

  logout: () => {
    set({ orgCode: '', orgName: '', isLoggedIn: false });
    localStorage.removeItem('token');
  },

  setOrgStore: (newState: Partial<OrgState>) => {    //设置机构状态
    set((state: OrgState) => ({ 
      ...state,
      ...newState
    }));
  }
})); 