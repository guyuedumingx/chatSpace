// 用户信息类型
export interface User {
  orgCode: string;
  ehrNo: string;
  phone: string;
  userName: string;
  orgName: string;
  isFirstLogin: boolean;
  lastPasswordChangeTime: string;
}

// 机构信息类型
export interface Branch {
  orgCode: string;
  orgName: string;
  conversationCount: number;
  dailyActiveUsers: number;
  avgSatisfactionRate: number;
  solvedRate: number;
}

// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  custom_prompts?: Array<{
    key: string;
    description: string;
  }>;
}

// 对话类型
export interface Conversation {
  id: string;
  orgCode: string;
  orgName: string;
  startTime: string;
  endTime: string;
  userName?: string;
  userPhone?: string;
  messages: Message[];
  status: 'active' | 'closed';
  hasSurvey: boolean;
}

// 满意度调查类型
export interface Survey {
  id: string;
  conversationId: string;
  orgCode: string;
  orgName: string;
  timestamp: string;
  solved: 'yes' | 'no';
  comment?: string;
  userName?: string;
  userPhone?: string;
}

// 仪表盘数据类型
export interface DashboardData {
  totalConversations: number;
  todayConversations: number;
  avgSatisfactionRate: number;
  solvedRate: number;
  conversationTrend: Array<{
    date: string;
    count: number;
  }>;
  topBranches: Array<{
    orgCode: string;
    orgName: string;
    count: number;
  }>;
}

// 分页请求参数类型
export interface PaginationParams {
  page: number;
  pageSize: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
} 