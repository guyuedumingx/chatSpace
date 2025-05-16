import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, Typography, Space, Card } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { sendMessage } from '../api/chat';

const { TextArea } = Input;
const { Text } = Typography;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendMessage(input.trim());
      const assistantMessage: Message = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { 
        role: 'assistant', 
        content: '抱歉，发生了错误，请稍后重试。' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card 
      style={{ 
        height: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column'
      }}
      bodyStyle={{ 
        padding: '24px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        marginBottom: '24px',
        padding: '0 16px'
      }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '16px',
            }}
          >
            <Space align="start" size={12}>
              {message.role === 'assistant' && (
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
              )}
              <div className={`message-bubble ${message.role}`}>
                <Text>{message.content}</Text>
              </div>
              {message.role === 'user' && (
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
              )}
            </Space>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <Space align="start" size={12}>
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <div className="message-bubble assistant">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </Space>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ 
        borderTop: '1px solid #f0f0f0',
        paddingTop: '16px',
        display: 'flex',
        gap: '12px'
      }}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          className="chat-input"
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          className="chat-button"
        >
          发送
        </Button>
      </div>
    </Card>
  );
};

export default ChatComponent; 