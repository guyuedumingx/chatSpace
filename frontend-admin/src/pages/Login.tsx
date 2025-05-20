import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 登录表单提交
  const handleSubmit = async (values: {
    orgId: string;
    ehrId: string;
    phone: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      // 这里应该调用登录API
      console.log('登录信息:', values);
      
      // 模拟登录成功
      setTimeout(() => {
        message.success('登录成功');
        localStorage.setItem('adminToken', 'mock-admin-token');
        navigate('/dashboard');
        setLoading(false);
      }, 1000);
    } catch {
      message.error('登录失败，请检查您的登录信息');
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
      <Card 
        title={
          <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#9A1F24' }}>
            银行业务助手管理系统
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
            name="orgId"
            rules={[{ required: true, message: '请输入机构号' }]}
          >
            <Input prefix={<BankOutlined />} placeholder="机构号" />
          </Form.Item>
          
          <Form.Item
            name="ehrId"
            rules={[{ required: true, message: '请输入联系人EHR' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="联系人EHR" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1\d{10}$/, message: '请输入正确的手机号格式' }
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="手机号" />
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