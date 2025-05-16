import React, { useEffect, useState } from 'react';
import { Layout, Menu, theme, Dropdown, Avatar, Space } from 'antd';
import { MessageOutlined, SettingOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ChatComponent from '../components/Chat';
import { getCurrentUser, logout } from '../api/user';
import type { User } from '../api/user';
const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        background: colorBgContainer,
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 'bold',
          color: '#1890ff'
        }}>
          Chat Space
        </div>
        {user && (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar src={user.avatar} icon={<UserOutlined />} />
              <span>{user.username}</span>
            </Space>
          </Dropdown>
        )}
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['chat']}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              {
                key: 'chat',
                icon: <MessageOutlined />,
                label: '聊天',
              },
              {
                key: 'settings',
                icon: <SettingOutlined />,
                label: '设置',
              },
            ]}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <ChatComponent />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 