import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import Chat from './pages/Chat';
import Login from './pages/Login';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#9A1F24',
          colorLink: '#9A1F24',
          colorLinkHover: '#c12a30',
          colorLinkActive: '#7a191e',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#f5222d',
          colorInfo: '#9A1F24',
          borderRadius: 4,
          wireframe: false,
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
          Card: {
            colorBorderSecondary: '#f0f0f0',
          },
          Layout: {
            colorBgHeader: '#fff',
            colorBgBody: '#f5f5f5',
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
