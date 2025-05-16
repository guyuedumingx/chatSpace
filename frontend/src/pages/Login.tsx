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
  const login = useOrgStore((state) => state.login);

  const onFinish = async (values: { orgCode: string; password: string }) => {
    const success = await login(values.orgCode, values.password);
    if (success) {
      message.success('登录成功');
      navigate('/chat');
    } else {
      message.error('机构号或密码错误');
    }
  };

  return (
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