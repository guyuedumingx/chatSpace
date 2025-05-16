import React, { useState, useRef, useEffect } from 'react';
import { Layout, Typography, Input, Button, Card, Avatar, Space, Tooltip } from 'antd';
import { SendOutlined, PictureOutlined, FileOutlined, SmileOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import './Chat.css';

const { Header, Content } = Layout;
const { Title } = Typography;
const { TextArea } = Input;

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Array<{
    type: 'text';
    content: { text: string };
    position: 'left' | 'right';
  }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      type: 'text',
      content: { text: '你好！我是AI助手，有什么我可以帮你的吗？' },
      position: 'left',
    }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (inputValue.trim()) {
      const newMessage = {
        type: 'text' as const,
        content: { text: inputValue },
        position: 'right' as const,
      };

      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
      setLoading(true);

      try {
        const response = await axios.post('http://localhost:8000/api/chat', {
          message: inputValue,
        });

        setMessages(prev => [...prev, {
          type: 'text',
          content: { text: response.data.response },
          position: 'left',
        }]);
      } catch (error) {
        setMessages(prev => [...prev, {
          type: 'text',
          content: { text: '抱歉，发生了一些错误，请稍后重试。' },
          position: 'left',
        }]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout className="chat-layout">
      <Header className="chat-header">
        <div className="header-content">
          <Title level={3} className="header-title">
            <RobotOutlined /> AI 业务咨询平台
          </Title>
        </div>
      </Header>
      <Content className="chat-content">
        <Card className="chat-card">
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-wrapper ${msg.position === 'right' ? 'message-right' : 'message-left'}`}
              >
                <Space className="message-content">
                  {msg.position === 'left' && (
                    <Avatar icon={<RobotOutlined />} className="avatar" />
                  )}
                  <div className={`message-bubble ${msg.position}`}>
                    {msg.content.text}
                  </div>
                  {msg.position === 'right' && (
                    <Avatar icon={<UserOutlined />} className="avatar" />
                  )}
                </Space>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="input-container">
            <Space.Compact style={{ width: '100%' }}>
              <Tooltip title="发送图片">
                <Button icon={<PictureOutlined />} />
              </Tooltip>
              <Tooltip title="发送文件">
                <Button icon={<FileOutlined />} />
              </Tooltip>
              <Tooltip title="表情">
                <Button icon={<SmileOutlined />} />
              </Tooltip>
              <TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="请输入消息..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                className="chat-input"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={loading}
                className="send-button"
              >
                发送
              </Button>
            </Space.Compact>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default ChatComponent; 