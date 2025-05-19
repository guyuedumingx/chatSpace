import { SearchOutlined } from '@ant-design/icons';
import { Sender } from '@ant-design/x';
import { Button, Flex } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';

interface ChatSenderProps {
  onSubmit: (value: string) => void;
  loading: boolean;
  onCancel: () => void;
}

const useStyle = createStyles(({ token, css }) => {
  return {
    sender: css`
      box-shadow: ${token.boxShadow};
      color: ${token.colorText};
    `,
    speechButton: css`
      font-size: 18px;
      color: ${token.colorText} !important;
    `,
    senderPrompt: css`
      color: ${token.colorText};
    `,
  };
});

const ChatSender: React.FC<ChatSenderProps> = ({ 
  onSubmit,
  loading,
  onCancel,
}) => {
  const { styles } = useStyle();
  const [inputValue, setInputValue] = useState<string>('');

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onSubmit(inputValue);
    setInputValue('');
  };

  return (
    <Sender
      value={inputValue}
      onSubmit={handleSubmit}
      onChange={setInputValue}
      onCancel={onCancel}
      prefix={<Button type="text" icon={<SearchOutlined style={{ fontSize: 18 }} />} />}
      loading={loading}
      className={styles.sender}
      actions={(_, info) => {
        const { SendButton, LoadingButton } = info.components;
        return (
          <Flex gap={4}>
            {loading ? <LoadingButton type="default" /> : <SendButton type="primary" />}
          </Flex>
        );
      }}
      placeholder="输入业务咨询内容"
    />
  );
};

export default ChatSender; 