import React, { StrictMode } from 'react';
import { ConfigProvider, theme } from 'antd';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import Chat from './pages/Chat';
import Login from './pages/Login';
import './styles/global.css';
import { useOrgStore } from './stores/OrgStore';

const App: React.FC = () => {
  const isLoggedIn = useOrgStore((state: any) => state.isLoggedIn);

  return (
    <StrictMode>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#9A1F24',
            colorInfo: '#9A1F24',
            colorSuccess: '#9A1F24',
            colorWarning: '#9A1F24',
            colorError: '#9A1F24',
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
            <Route
              path="/login"
              element={isLoggedIn ? <Navigate to="/chat" replace /> : <Login />}
            />
            <Route
              path="/chat"
              element={isLoggedIn ? <Chat /> : <Navigate to="/login" replace />}
            />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </StrictMode>
  );
};

export default App;
