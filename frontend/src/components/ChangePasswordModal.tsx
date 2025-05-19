import React, { useState } from 'react';
import { Modal, Form, Input, message, Typography } from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone, ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ChangePasswordModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  isFirstLogin?: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  isFirstLogin = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // TODO: 调用修改密码接口
      // const response = await changePassword(values);
      
      message.success('密码修改成功');
      onSuccess();
    } catch (error) {
      console.error('密码修改失败:', error);
      message.error('密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    if (isFirstLogin) {
      return "首次登录密码修改";
    }
    return "密码修改提醒";
  };

  const getModalDescription = () => {
    if (isFirstLogin) {
      return "为了保障您的账户安全，首次登录需要修改密码。";
    }
    return "您的密码已超过三个月未修改，为了账户安全，请及时更新密码。";
  };

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      maskClosable={false}
      closable={false}
      okText="确认"
      cancelText="取消"
      width={500}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 16, marginRight: 8, marginTop: 4 }} />
          <Text>{getModalDescription()}</Text>
        </div>
        <Text type="secondary" style={{ fontSize: 13 }}>
          密码要求：至少8位，必须包含大小写字母、数字和特殊字符
        </Text>
      </div>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="oldPassword"
          label="原密码"
          rules={[{ required: true, message: '请输入原密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入原密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码长度不能小于8位' },
            { 
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message: '密码必须包含大小写字母、数字和特殊字符'
            }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入新密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请确认新密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal; 