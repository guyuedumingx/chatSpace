import axios from "axios";
import { message } from "antd";
import dayjs from "dayjs";

const API_BASE_URL = "http://localhost:8000/api";

export interface ChatResponse {
  response: string;
}

export const sendMessage = async (message: string): Promise<ChatResponse> => {
  const response = await axios.post(`${API_BASE_URL}/chat`, { message });
  return response.data;
};

// 模拟会话数据
const MOCK_CONVERSATIONS = [
  {
    key: "default-0",
    label: "业务咨询",
    group: "今天",
  },
  {
    key: "default-2",
    label: "业务咨询3",
    group: "昨天",
  },
];

// 模拟热点问题
const MOCK_HOT_TOPICS = [
  {
    key: "1-1",
    description: "如何办理对公账户开户？",
    icon: "1",
  },
  {
    key: "1-2",
    description: "企业网银如何开通？",
    icon: "2",
  },
  {
    key: "1-3",
    description: "对公转账限额是多少？",
    icon: "3",
  },
  {
    key: "1-4",
    description: "如何申请企业贷款？",
    icon: "4",
  },
  {
    key: "1-5",
    description: "企业理财有哪些产品？",
    icon: "5",
  },
];

// 模拟消息历史
const MOCK_MESSAGE_HISTORY: Record<string, any> = {};

export const chatApi = {
  // 获取会话列表
  getConversations: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_CONVERSATIONS);
      }, 500);
    });
  },

  // 创建新会话
  createConversation: async (index: number) => {
    const now = dayjs().valueOf().toString();
    return {
      key: now,
      label: `业务咨询 ${index}`,
      group: "今天",
    };
  },

  // 删除会话
  deleteConversation: async (key: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        delete MOCK_MESSAGE_HISTORY[key];
        resolve(true);
      }, 500);
    });
  },

  // 获取热点问题
  getHotTopics: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_HOT_TOPICS);
      }, 500);
    });
  },

  // 获取消息历史
  getMessageHistory: async (conversationKey: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_MESSAGE_HISTORY[conversationKey] || []);
      }, 500);
    });
  },

  // 保存消息历史
  saveMessageHistory: async (conversationKey: string, messages: any[]) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        MOCK_MESSAGE_HISTORY[conversationKey] = messages;
        resolve(true);
      }, 500);
    });
  },
};
