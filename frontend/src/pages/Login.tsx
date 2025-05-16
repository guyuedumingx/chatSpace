import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import React from 'react';
import { Button, Card, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '@/stores/OrgStore';
import { createStyles } from 'antd-style';
import logo from '@/assets/logo.svg';

const useStyle = createStyles(({ token, css }) => ({
  container: css`
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${token.colorBgLayout};
  `,
  card: css`
    width: 400px;
    padding: 24px;
    border-radius: 8px;
    box-shadow: ${token.boxShadow};
  `,
  logo: css`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    gap: 8px;

    span {
      font-size: 20px;
      font-weight: bold;
      color: ${token.colorText};
    }
  `,
  form: css`
    .ant-form-item-label {
      font-weight: 500;
    }
  `,
}));

const Login: React.FC = () => {
  const { styles } = useStyle();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [remember, setRemember] = useState(false);
  const [bankImageExists, setBankImageExists] = useState(true);

  useEffect(() => {
    // 检查银行图片是否存在
    const checkImageExists = async () => {
      try {
        // 尝试直接使用导入的图片
        if (bankBuilding) {
          setBankImageExists(true);
        } else {
          setBankImageExists(false);
        }
      } catch (error) {
        setBankImageExists(false);
        console.error('Failed to load bank image:', error);
      }
    };
    
    checkImageExists();
  }, []);
  const login = useOrgStore((state) => state.login);

  const handleSubmit = async (values: LoginForm) => {
    try {
      const response = await login(values.username, values.password);
      localStorage.setItem('token', response.token);
      if (remember) {
        localStorage.setItem('rememberedUsername', values.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }
  const onFinish = async (values: { orgCode: string; password: string }) => {
    const success = await login(values.orgCode, values.password);
    if (success) {
      message.success('登录成功');
      navigate('/chat');
    } else {
      message.error('机构号或密码错误');
    }
  };

  const handleChangePassword = () => {
    message.info('登录后可在个人中心修改密码');
  };

  return (
    <div className="login-container">
      <Row className="login-row">
        <Col span={14} className="login-left">
          <div className="bank-building-container">
            {bankImageExists ? (
              <>
                <div className="gradient-overlay"></div>
                <img src={bankBuilding} alt="中国银行大楼" className="bank-building-image" />
              </>
            ) : (
              <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>
                  <UserOutlined />
                </div>
                <Title level={3} style={{ color: 'white', margin: 0 }}>中国银行</Title>
                <Title level={4} style={{ color: 'white', margin: 0 }}>远程核准线上咨询平台</Title>
              </div>
            )}
          </div>
        </Col>
        <Col span={10} className="login-right">
          <div className="login-form-container">
            <div className="login-header">
              <div className="platform-title-container">
                <Title level={2} className="login-title">远程核准线上咨询平台</Title>
              </div>
            </div>
            
            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              initialValues={{
                username: localStorage.getItem('rememberedUsername') || '',
                remember: !!localStorage.getItem('rememberedUsername')
              }}
              className="login-form"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入机构号' }]}
              >
                <Input
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  placeholder="请输入机构号"
                  size="large"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  placeholder="请输入密码"
                  size="large"
                  className="login-input"
                  iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Checkbox 
                      checked={remember} 
                      onChange={(e) => setRemember(e.target.checked)}
                    >
                      <Text className="remember-text">记住账号</Text>
                    </Checkbox>
                  </Col>
                  <Col className="password-links">
                    <Button type="link" className="forgot-password" onClick={handleChangePassword}>
                      修改密码
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  className="login-button"
                >
                  登录
                </Button>
              </Form.Item>
              
              <div className="security-notice">
                <Text type="secondary">本平台严禁发送任何客户信息/涉密信息/敏感信息!</Text>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.logo}>
          <img src={logo} alt="logo" width={32} height={32} />
          <span>远程核准线上咨询平台</span>
        </div>
        <Form
          name="login"
          onFinish={onFinish}
          className={styles.form}
          layout="vertical"
        >
          <Form.Item
            label="机构号"
            name="orgCode"
            rules={[{ required: true, message: '请输入机构号' }]}
          >
            <Input placeholder="请输入机构号" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 