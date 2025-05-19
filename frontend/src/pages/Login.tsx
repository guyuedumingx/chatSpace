import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Row, Col, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '@/stores/OrgStore';
import '@/pages/Login.css';
// 正确导入图片
import bankBuilding from '@/assets/bank-building1.jpg';
import ChangePasswordModal from '@/components/ChangePasswordModal';

const { Title, Text } = Typography;

interface LoginForm {
  orgCode: string;  // 机构号
  password: string; // 密码
}

interface OrgInfo {
  orgName: string;    //机构名称
  isFirstLogin: boolean; //是否首次登录
  lastPasswordChangeTime: string; //密码最后修改时间
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bankImageExists, setBankImageExists] = useState(true);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  
  // 获取OrgStore中的login函数
  const login = useOrgStore((state: any) => state.login);

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

  // 检查机构号并获取机构信息
  const checkOrgCode = async (orgCode: string) => {
    try {
      // TODO: 调用后端接口获取机构信息
      // const response = await getOrgInfo(orgCode);
      // setOrgInfo(response.data);
      
      // 模拟数据
      setOrgInfo({
        orgName: "集约运营中心（广东）--测试",
        isFirstLogin: false,
        lastPasswordChangeTime: "2024-01-01"
      });
    } catch (error) {
      console.error('获取机构信息失败:', error);
      setOrgInfo(null);
    }
  };

  // 检查密码是否需要修改
  const checkPasswordChangeRequired = (lastPasswordChangeTime: string) => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return new Date(lastPasswordChangeTime) < threeMonthsAgo;
  };

  const handleSubmit = async (values: LoginForm) => {
    try {
      setLoading(true);
      // TODO: 调用登录接口
      // const response = await login(values);
      
      // 模拟登录成功
      const isFirstLogin = orgInfo?.isFirstLogin || false;
      const needChangePassword = isFirstLogin || 
        (orgInfo?.lastPasswordChangeTime && checkPasswordChangeRequired(orgInfo.lastPasswordChangeTime));

      if (needChangePassword) {
        setIsFirstLogin(isFirstLogin);
        setShowChangePassword(true);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请检查机构号和密码');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowChangePassword(false);
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <Row className="login-row">
        <Col flex="55%" className="login-left">
          <div className="bank-building-container">
            {bankImageExists ? (
              <img src={bankBuilding} alt="中国银行大楼" className="bank-building-image" />
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
        <Col flex="45%" className="login-right">
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
                orgCode: localStorage.getItem('rememberedOrgCode') || '',
                remember: !!localStorage.getItem('rememberedOrgCode')
              }}
              className="login-form"
            >
              {orgInfo && (
                <div className="org-info">
                  <Text type="secondary">你好！{orgInfo.orgName}</Text>
                </div>
              )}
              <Form.Item
                name="orgCode"
                rules={[{ required: true, message: '请输入机构号' }]}
              >
                <Input
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  placeholder="请输入机构号"
                  size="large"
                  className="login-input"
                  onChange={(e) => checkOrgCode(e.target.value)}
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
                    <Button type="link" className="forgot-password">
                      忘记密码？
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
                  loading={loading}
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
      <ChangePasswordModal
        visible={showChangePassword}
        onCancel={() => setShowChangePassword(false)}
        onSuccess={handlePasswordChangeSuccess}
        isFirstLogin={isFirstLogin}
      />
    </div>
  );
};

export default Login; 