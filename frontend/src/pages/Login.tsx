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

// 以下是与后端集成的API函数
// 获取机构信息
const getOrgInfo = async (orgCode: string): Promise<OrgInfo> => {
  // TODO: 替换为实际的API调用
  // 例如：return await fetch(`/api/org/${orgCode}`).then(res => res.json());
  
  // 模拟数据
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟成功返回
      if (orgCode === '36909' || orgCode === '36910') {
        resolve({
          orgName: "集约运营中心（广东）--测试",
          isFirstLogin: false,
          lastPasswordChangeTime: "2025-05-01" // 未过期的日期
        });
      } else {
        // 模拟失败
        reject({ code: 'ORG_NOT_FOUND', message: '机构号不存在' });
      }
    }, 500);
  });
};

// 登录API
const loginApi = async (orgCode: string, password: string): Promise<{
  token: string;
  isFirstLogin: boolean;
  lastPasswordChangeTime: string;
  orgName: string;
}> => {
  // TODO: 替换为实际的API调用
  // 例如：return await fetch('/api/login', { method: 'POST', body: JSON.stringify({ orgCode, password }) }).then(res => res.json());
  
  // 模拟数据
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟登录成功
      if ((orgCode === '36909' && password === '123456') || 
          (orgCode === '36910' && password === '123456')) {
        resolve({
          token: 'mock-token-123456',
          isFirstLogin: false,
          lastPasswordChangeTime: "2025-05-01", // 未过期的日期
          orgName: "集约运营中心（广东）--测试"
        });
      } else {
        // 模拟密码错误
        reject({ code: 'PASSWORD_ERROR', message: '密码错误' });
      }
    }, 800);
  });
};

// 修改密码API
const changePasswordApi = async (orgCode: string, oldPassword: string, newPassword: string): Promise<boolean> => {
  // TODO: 替换为实际的API调用
  // 例如：return await fetch('/api/change-password', { 
  //   method: 'POST', 
  //   body: JSON.stringify({ orgCode, oldPassword, newPassword }) 
  // }).then(res => res.json());
  
  // 模拟数据
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟成功
      if ((orgCode === '36909' && oldPassword === '123456') || 
          (orgCode === '36910' && oldPassword === '123456')) {
        resolve(true);
      } else {
        // 模拟失败
        reject({ message: '修改密码失败，原密码错误' });
      }
    }, 1000);
  });
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bankImageExists, setBankImageExists] = useState(true);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isForceChange, setIsForceChange] = useState(false);
  const [currentOrgCode, setCurrentOrgCode] = useState<string>('');
  
  // 获取OrgStore中的login函数
  const loginStore = useOrgStore((state: any) => state.login);
  const setOrgStore = useOrgStore((state: any) => state.setOrgStore);

  useEffect(() => {
    // 检查银行图片是否存在
    const checkImageExists = async () => {
      try {
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
    if (!orgCode) {
      setOrgInfo(null);
      return;
    }
    
    try {
      // 调用后端接口获取机构信息
      const orgData = await getOrgInfo(orgCode);
      setOrgInfo(orgData);
      setCurrentOrgCode(orgCode);
    } catch (error: any) {
      console.error('获取机构信息失败:', error);
      setOrgInfo(null);
      message.error(error.message || '机构号不存在');
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
      
      // 调用登录接口
      const loginResult = await loginApi(values.orgCode, values.password);
      
      // 将token存储到localStorage或状态管理中
      localStorage.setItem('token', loginResult.token);
      
      // 更新OrgStore中的状态
      setOrgStore({
        orgCode: values.orgCode,
        orgName: loginResult.orgName,
        isLoggedIn: true
      });
      
      // 检查是否需要修改密码
      const isFirstLogin = loginResult.isFirstLogin;
      const needChangePassword = isFirstLogin || 
        checkPasswordChangeRequired(loginResult.lastPasswordChangeTime);

      if (needChangePassword) {
        setIsFirstLogin(isFirstLogin);
        setIsForceChange(true);
        setShowChangePassword(true);
        setCurrentOrgCode(values.orgCode);
      } else {
        // 登录成功后保存记住的账号
        if (remember) {
          localStorage.setItem('rememberedOrgCode', values.orgCode);
        } else {
          localStorage.removeItem('rememberedOrgCode');
        }
        message.success('登录成功');
        // 使用navigate跳转到chat页面
        navigate('/chat');
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      if (error.code === 'ORG_NOT_FOUND') {
        message.error('机构号不存在');
      } else if (error.code === 'PASSWORD_ERROR') {
        message.error('密码错误');
      } else {
        message.error(error.message || '登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSuccess = async (oldPassword: string, newPassword: string) => {
    try {
      // 调用修改密码API
      await changePasswordApi(currentOrgCode, oldPassword, newPassword);
      
      setShowChangePassword(false);
      setIsForceChange(false);
      message.success('密码修改成功');
      
      // 登录成功后保存记住的账号
      if (remember) {
        localStorage.setItem('rememberedOrgCode', currentOrgCode);
      } else {
        localStorage.removeItem('rememberedOrgCode');
      }
      
      // 跳转到chat页面
      navigate('/chat');
    } catch (error: any) {
      message.error(error.message || '密码修改失败');
    }
  };

  const handleChangePassword = () => {
    if (!currentOrgCode) {
      message.warning('请先输入机构号');
      return;
    }
    setIsForceChange(false);
    setShowChangePassword(true);
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
                  onBlur={(e) => checkOrgCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      checkOrgCode(e.currentTarget.value);
                    }
                  }}
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
        onCancel={() => {
          if (!isForceChange) {
            setShowChangePassword(false);
          }
        }}
        onSuccess={(oldPassword, newPassword) => handlePasswordChangeSuccess(oldPassword, newPassword)}
        isFirstLogin={isFirstLogin}
        isForceChange={isForceChange}
      />
    </div>
  );
};

export default Login; 