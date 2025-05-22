import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Row, Col, Checkbox, Modal } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '@/stores/OrgStore';
import '@/pages/Login.css';
// 正确导入图片
import bankBuilding from '@/assets/bank-building1.jpg';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { orgApi } from '@/api/org';

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

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isForceChange, setIsForceChange] = useState(false);
  const [currentOrgCode, setCurrentOrgCode] = useState<string>('');
  const [messageApi, contextHolder] = message.useMessage();

  
  // 获取OrgStore中的login函数
  const loginStore = useOrgStore((state: any) => state.login);

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
      const orgData = await orgApi.getOrgInfo(orgCode);
      setOrgInfo(orgData);
      setCurrentOrgCode(orgCode);
      form.setFieldsValue({
        contactEhr: orgData.contactEhr,
        contactName: orgData.contactName,
        contactPhone: orgData.contactPhone
      });
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
    console.log(values);
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
      const loginResult = await loginStore(values);
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
        // 使用navigate跳转到chat页面
        navigate('/chat');
        // window.location.href = '/chat';
      }
    } catch (error: any) {
      messageApi.error('登录失败，请检查机构号、密码是否正确');
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
      await orgApi.changePassword(currentOrgCode, oldPassword, newPassword);
      
      setShowChangePassword(false);
      setIsForceChange(false);
      messageApi.success('密码修改成功');
      
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
      {contextHolder}
      <Row className="login-row">
        <Col flex="55%" className="login-left">
          <div className="bank-building-container">
            <img src={bankBuilding} alt="中国银行大楼" className="bank-building-image" />
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
                    name="contactEhr"
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
                    name="contactName"
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
                name="contactPhone"
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