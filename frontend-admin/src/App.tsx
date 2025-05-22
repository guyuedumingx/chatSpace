import React from 'react';
import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';

// 布局组件
import AdminLayout from './layouts/AdminLayout';

// 页面组件
import Dashboard from './pages/Dashboard';
import Branches from './pages/Organization';
import Conversations from './pages/Conversations';
import Login from './pages/Login';
import QuestionBank from './pages/QuestionBank';

// 认证检查组件
const AuthRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  const location = useLocation();
  
  console.log('AuthRoute - 认证状态:', isAuthenticated, '路径:', location.pathname);
  
  if (!isAuthenticated) {
    // 重定向到登录页面，保存当前位置用于登录后跳回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return element;
};

const App: React.FC = () => {
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
            colorPrimaryHover: '#7a191e',
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
          <Route path="/" element={<AuthRoute element={<AdminLayout />} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="branches" element={<Branches />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="question-bank" element={<QuestionBank />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
