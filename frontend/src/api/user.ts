import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// 模拟用户数据
const mockUsers = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
  }
];

// 模拟登录
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.username === username && u.password === password);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        resolve({
          token: `mock-token-${user.id}`,
          user: userWithoutPassword
        });
      } else {
        reject(new Error('用户名或密码错误'));
      }
    }, 1000);
  });
};

// 模拟获取当前用户信息
export const getCurrentUser = async (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem('token');
    if (!token) {
      reject(new Error('未登录'));
      return;
    }

    const userId = token.split('-')[2];
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      resolve(userWithoutPassword);
    } else {
      reject(new Error('用户不存在'));
    }
  });
};

// 模拟登出
export const logout = async (): Promise<void> => {
  return new Promise((resolve) => {
    localStorage.removeItem('token');
    resolve();
  });
}; 