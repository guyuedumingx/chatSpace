import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { BankOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../api';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();
  
  // 获取来源路径，用于登录后重定向
  const from = location.state?.from?.pathname || '/dashboard';

  // 检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/');
    }
  }, [navigate]);
  
  // 登录表单提交
  const handleSubmit = async (values: {
    orgCode: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const response = await login(values.orgCode, values.password);
      
      if (response.access_token) {
        // 保存登录信息
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        messageApi.success('登录成功');
        
        // 延迟导航以确保消息显示
        setTimeout(() => {
          // 如果是浏览器直接刷新登录页，使用window.location
          // 否则使用React Router导航
          if (window.location.pathname === '/login') {
            window.location.href = from;
          } else {
            navigate(from, { replace: true });
          }
        }, 1000);
      } else {
        messageApi.error('登录失败，请检查您的机构号和密码');
      }
    } catch (error) {
      messageApi.error('登录失败，请检查您的机构号和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f0f2f5'
    }}>
      {contextHolder}
      <Card 
        title={
          <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#9A1F24' }}>
            远程核准线上咨询平台管理端
          </div>
        }
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      >
        <Form
          name="login"
          onFinish={handleSubmit}
          initialValues={{ remember: true }}
          size="large"
        >
          <Form.Item
            name="orgCode"
            rules={[{ required: true, message: '请输入机构号' }]}
          >
            <Input prefix={<BankOutlined />} placeholder="机构号" />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              style={{ width: '100%', backgroundColor: '#9A1F24', borderColor: '#9A1F24' }}
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 