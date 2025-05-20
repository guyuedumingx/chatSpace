import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Row, Col, Checkbox, Modal } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '@/stores/OrgStore';
import '@/pages/Login.css';
// 正确导入图片
import bankBuilding from '@/assets/bank-building1.jpg';
import ChangePasswordModal from '@/components/ChangePasswordModal';

const { Title, Text } = Typography;

// 登录表单接口定义
interface LoginForm {
  orgCode: string;  // 机构号
  password: string; // 密码
  ehrNo: string;    // EHR号
  userName: string; // 姓名
  phone: string;    // 联系电话
}

// 机构信息接口定义
interface OrgInfo {
  orgName: string;    // 机构名称
  isFirstLogin: boolean; // 是否首次登录
  lastPasswordChangeTime: string; // 密码最后修改时间
}

// 错误类型定义
interface ApiError {
  code: string;
  message: string;
}

/**
 * 获取机构信息API
 * @param orgCode 机构号
 * @returns Promise<OrgInfo> 机构信息
 */
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

/**
 * 登录API
 * @param orgCode 机构号
 * @param password 密码
 * @param ehrNo EHR号
 * @param userName 姓名
 * @param phone 联系电话
 * @returns Promise<登录结果>
 */
const loginApi = async (orgCode: string, password: string, ehrNo: string, userName: string, phone: string): Promise<{
  token: string;
  isFirstLogin: boolean;
  lastPasswordChangeTime: string;
  orgName: string;
}> => {
  // TODO: 替换为实际的API调用
  // 例如：return await fetch('/api/login', { 
  //   method: 'POST', 
  //   body: JSON.stringify({ orgCode, password, ehrNo, userName, phone }) 
  // }).then(res => res.json());
  
  // 模拟数据
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟登录成功
      if ((orgCode === '36909' && password === '123456') || 
          (orgCode === '36910' && password === '123456')) {
        resolve({
          token: 'mock-token-123456',
          isFirstLogin: false,
          lastPasswordChangeTime: "2025-01-01", // 未过期的日期
          orgName: "集约运营中心（广东）--测试"
        });
      } else {
        // 模拟密码错误
        reject({ code: 'PASSWORD_ERROR', message: '密码错误' });
      }
    }, 800);
  });
};

/**
 * 修改密码API
 * @param orgCode 机构号
 * @param oldPassword 原密码
 * @param newPassword 新密码
 * @returns Promise<boolean> 是否修改成功
 */
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

  /**
   * 检查机构号并获取机构信息
   * @param orgCode 机构号
   */
  const checkOrgCode = async (orgCode: string) => {
    if (!orgCode) {
      setOrgInfo(null);
      setCurrentOrgCode('');
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
      setCurrentOrgCode('');
      form.setFields([
        {
          name: 'orgCode',
          errors: [error.message || '机构号不存在']
        }
      ]);
    }
  };

  /**
   * 检查密码是否需要修改
   * @param lastPasswordChangeTime 最后修改密码时间
   * @returns boolean 是否需要修改密码
   */
  const checkPasswordChangeRequired = (lastPasswordChangeTime: string) => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return new Date(lastPasswordChangeTime) < threeMonthsAgo;
  };

  /**
   * 处理登录提交
   * @param values 登录表单值
   */
  const handleSubmit = async (values: LoginForm) => {
    try {
      setLoading(true);
      
      // 先验证机构号是否存在
      if (!orgInfo) {
        form.setFields([
          {
            name: 'orgCode',
            errors: ['请先输入正确的机构号']
          }
        ]);
        return;
      }
      
      // 调用登录接口
      const loginResult = await loginApi(values.orgCode, values.password, values.ehrNo, values.userName, values.phone);
      
      // 将token存储到localStorage
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
        form.setFields([
          {
            name: 'orgCode',
            errors: ['机构号不存在']
          }
        ]);
      } else if (error.code === 'PASSWORD_ERROR') {
        form.setFields([
          {
            name: 'password',
            errors: ['密码错误']
          }
        ]);
      } else {
        message.error(error.message || '登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理密码修改成功
   * @param oldPassword 原密码
   * @param newPassword 新密码
   */
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
      Modal.error({
        title: '密码修改错误',
        content: error.message || '密码修改失败',
      });
    }
  };

  /**
   * 处理修改密码按钮点击
   */
  const handleChangePassword = () => {
    if (!currentOrgCode) {
      Modal.warning({
        title: '提示',
        content: '请先输入机构号',
      });
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
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="ehrNo"
                    rules={[
                      { required: true, message: '请输入EHR号' },
                      { pattern: /^\d+$/, message: 'EHR号只能输入数字' }
                    ]}
                  >
                    <Input
                      prefix={<IdcardOutlined className="site-form-item-icon" />}
                      placeholder="请输入EHR号"
                      size="large"
                      className="login-input"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="userName"
                    rules={[
                      { required: true, message: '请输入姓名' },
                      { pattern: /^[\u4e00-\u9fa5]+$/, message: '姓名只能输入汉字' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="site-form-item-icon" />}
                      placeholder="请输入姓名"
                      size="large"
                      className="login-input"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^\d+$/, message: '联系电话只能输入数字' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined className="site-form-item-icon" />}
                  placeholder="请输入联系电话"
                  size="large"
                  className="login-input"
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