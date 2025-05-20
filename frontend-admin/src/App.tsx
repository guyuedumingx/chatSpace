import React from 'react';
import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';

// 布局组件
import AdminLayout from './layouts/AdminLayout';

// 页面组件
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import Conversations from './pages/Conversations';
import Surveys from './pages/Surveys';
import Login from './pages/Login';

const App: React.FC = () => {
  // 检查用户是否已登录
  const isAuthenticated = () => {
    return !!localStorage.getItem('adminToken');
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#9A1F24',
          colorInfo: '#9A1F24',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorLink: '#9A1F24',
          colorLinkHover: '#c12a30',
          colorLinkActive: '#7a191e',
        },
        components: {
          Button: {
            colorPrimary: '#9A1F24',
            colorPrimaryHover: '#c12a30',
            colorPrimaryActive: '#7a191e',
          },
          Menu: {
            colorItemBg: 'transparent',
            colorItemText: '#000000d9',
            colorItemTextSelected: '#9A1F24',
            colorItemBgSelected: '#fff1f0',
            colorItemTextHover: '#c12a30',
            colorItemBgHover: '#fff1f0',
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              isAuthenticated() ? (
                <AdminLayout />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="branches" element={<Branches />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="surveys" element={<Surveys />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
