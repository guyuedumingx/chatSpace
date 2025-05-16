import {
  CopyOutlined,
  DeleteOutlined,
  FireOutlined,
  LikeOutlined,
  LogoutOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Welcome,
  useXAgent,
  useXChat,
} from '@ant-design/x';
import type { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';
import { Button, Flex, type GetProp, Space, Spin, message } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.svg';
import bot from '@/assets/bot.svg';
import { useOrgStore } from '@/stores/OrgStore';
import { chatApi } from '@/api/chat';

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
      min-width: 1000px;
      height: 100vh;
      display: flex;
      background: ${token.colorBgContainer};
      font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;
    `,
    // sider 样式
    sider: css`
      background: ${token.colorBgLayout}80;
      width: 280px;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0 12px;
      box-sizing: border-box;
    `,
    logo: css`
      display: flex;
      align-items: center;
      justify-content: start;
      box-sizing: border-box;
      gap: 8px;
      margin: 24px 0;

      span {
        font-weight: bold;
        color: ${token.colorText};
        font-size: 16px;
      }
    `,
    addBtn: css`
      background:rgba(255, 22, 111, 0.06);
      height: 40px;
    `,
    conversations: css`
      flex: 1;
      overflow-y: auto;
      margin-top: 12px;
      padding: 0;

      .ant-conversations-list {
        padding-inline-start: 0;
      }
    `,
    siderFooter: css`
      border-top: 1px solid ${token.colorBorderSecondary};
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    // chat list 样式
    chat: css`
      height: 100%;
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding: ${token.paddingLG}px;
      gap: 16px;
    `,
    chatPrompt: css`
      .ant-prompts-label {
        color: #000000e0 !important;
      }
      .ant-prompts-desc {
        color: #000000a6 !important;
        width: 100%;
      }
      .ant-prompts-icon {
        color: #000000a6 !important;
      }
    `,
    chatList: css`
      flex: 1;
      overflow: auto;
      padding-right: 10px;
    `,
    loadingMessage: css`
      background-size: 100% 2px;
      background-repeat: no-repeat;
      background-position: bottom;
    `,
    placeholder: css`
      padding-top: 32px;
    `,
    // sender 样式
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

const Chat: React.FC = () => {
  const { styles } = useStyle();
  const navigate = useNavigate();
  const abortController = useRef<AbortController>(null);
  const { orgCode, orgName, logout } = useOrgStore();

  // ==================== State ====================
  const [messageHistory, setMessageHistory] = useState<Record<string, any>>({});
  const [conversations, setConversations] = useState<any[]>([]);
  const [curConversation, setCurConversation] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [hotTopics, setHotTopics] = useState<any>([]);

  // ==================== Runtime ====================
  const [agent] = useXAgent<BubbleDataType>({
    baseURL: 'https://api.siliconflow.cn/v1/chat/completions',
    model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
    dangerouslyApiKey: 'Bearer sk-ravoadhrquyrkvaqsgyeufqdgphwxfheifujmaoscudjgldr',
  });
  const loading = agent.isRequesting();

  const { onRequest, messages, setMessages } = useXChat({
    agent,
    requestFallback: (_, { error }) => {
      if (error.name === 'AbortError') {
        return {
          content: '请求被中止',
          role: 'assistant',
        };
      }
      return {
        content: '请求失败，请重试！',
        role: 'assistant',
      };
    },
    transformMessage: (info) => {
      const { originMessage, chunk } = info || {};
      let currentText = '';
      try {
        if (chunk?.data && !chunk?.data.includes('DONE')) {
          const message = JSON.parse(chunk?.data);
          currentText = !message?.choices?.[0].delta?.reasoning_content
            ? ''
            : message?.choices?.[0].delta?.reasoning_content;
        }
      } catch (error) {
        console.error(error);
      }
      return {
        content: (originMessage?.content || '') + currentText,
        role: 'assistant',
      };
    },
    resolveAbortController: (controller) => {
      abortController.current = controller;
    },
  });

  // ==================== Event ====================
  const onSubmit = (val: string) => {
    if (!val) return;

    if (loading) {
      message.error('请求进行中，请稍后...');
      return;
    }

    onRequest({
      stream: true,
      message: { role: 'user', content: val },
    });
  };

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  // ==================== Effects ====================
  useEffect(() => {
    const initData = async () => {
      const [conversationsData, hotTopicsData] = await Promise.all([
        chatApi.getConversations(),
        chatApi.getHotTopics(),
      ]);
      setConversations(conversationsData as any[]);
      setHotTopics(hotTopicsData);
      if (conversationsData && (conversationsData as any[]).length > 0) {
        setCurConversation((conversationsData as any[])[0].key);
        const history = await chatApi.getMessageHistory((conversationsData as any[])[0].key);
        setMessages(history as any);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (messages?.length) {
      chatApi.saveMessageHistory(curConversation, messages);
    }
  }, [messages, curConversation]);

  // ==================== Nodes ====================
  const chatSider = (
    <div className={styles.sider}>
      {/* 🌟 Logo */}
      <div className={styles.logo}>
        <img
          src={logo}
          draggable={false}
          alt="logo"
          width={24}
          height={24}
        />
        <span>远程核准线上咨询平台</span>
      </div>

      {/* 🌟 添加会话 */}
      <Button
        onClick={async () => {
          const newConversation = await chatApi.createConversation(conversations.length+1);
          setConversations([newConversation, ...conversations]);
          setCurConversation(newConversation.key);
          setMessages([]);
        }}
        type="link"
        className={styles.addBtn}
        icon={<PlusOutlined />}
      >
        新建咨询会话
      </Button>

      {/* 🌟 会话管理 */}
      <Conversations
        items={conversations}
        className={styles.conversations}
        activeKey={curConversation}
        onActiveChange={async (val) => {
          abortController.current?.abort();
          setTimeout(async () => {
            setCurConversation(val);
            const history = await chatApi.getMessageHistory(val);
            setMessages(history as any);
          }, 100);
        }}
        groupable
        styles={{ item: { padding: '0 8px' } }}
        menu={(conversation) => ({
          items: [
            {
              label: '删除',
              key: 'delete',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: async () => {
                await chatApi.deleteConversation(conversation.key);
                const newList = conversations.filter((item) => item.key !== conversation.key);
                const newKey = newList?.[0]?.key;
                setConversations(newList);
                setTimeout(async () => {
                  if (conversation.key === curConversation) {
                    setCurConversation(newKey);
                    const history = await chatApi.getMessageHistory(newKey);
                    setMessages(history as any);
                  }
                }, 200);
              },
            },
          ],
        })}
      />

      <div className={styles.siderFooter}>
        {/* <Avatar size={24} /> */}
        <img src={logo} alt="bot" width={24} height={24} />
        <span>{orgName}</span>
        <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} />
      </div>
    </div>
  );
  const chatList = (
    <div className={styles.chatList}>
      {messages?.length ? (
        /* 🌟 消息列表 */
        <Bubble.List
          items={messages?.map((i) => ({
            ...i.message,
            classNames: {
              content: i.status === 'loading' ? styles.loadingMessage : '',
            },
            typing: i.status === 'loading' ? { step: 5, interval: 20 } : false,
          }))}
          style={{ height: '100%', overflow: 'auto', scrollbarWidth: 'none'  }}
          autoScroll
          roles={{
            assistant: {
              placement: 'start',
              avatar: <img src={bot} alt="bot" width={24} height={24} />,
              footer: (message: any) => (
                <div>
                  <div style={{ fontSize: 12, color: '#000000a6', marginLeft: 5 }}>
                    本平台仅供内部使用，严禁发送任何客户信息/涉密信息/敏感信息
                  </div>
                  <div style={{ display: 'flex' }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      title="复制"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (message?.content) {
                          navigator.clipboard.writeText(message.content);
                          message.success('复制成功');
                        }
                      }}
                    />
                    <Button type="text" size="small" icon={<LikeOutlined />} title="满意" />
                  </div>
                </div>
              ),
              loadingRender: () => <Spin size="small" />,
            },
            user: { placement: 'end', avatar: <img src={logo} alt="logo" width={24} height={24} /> },
          }}
        />
      ) : (
        <Space direction="vertical" size={16} className={styles.placeholder}>
          <Welcome
            icon={<img src={bot} alt="bot" />}
            variant="borderless"
            title="你好，欢迎使用远程核准线上咨询平台"
            description="本平台仅供内部使用，严禁发送任何客户信息/涉密信息/敏感信息"
          />
          <div style={{ fontSize: 16, fontWeight: 500, color: '#000000e0' }}>
            <FireOutlined style={{ marginRight: 8 }} />
            <span>热点咨询</span>
          </div>
          <Flex gap={16}>
            <Prompts
              items={hotTopics?.map((item: any, index: number) => ({
                key: item.key,
                description: item.description,
                icon: <>{index + 1}</>,
                children: item.children || [],
              }))}
              wrap
              styles={{
                list: { height: '100%', width: '100%' },
                item: {
                  flex: 'none',
                  width: 'calc(50% - 6px)',
                  backgroundColor: '#f0f0f0',
                  borderRadius: 12,
                  border: 'none',
                },
                subItem: { padding: 0, background: 'transparent' },
              }}
              onItemClick={(info) => {
                onSubmit(info.data.description as string);
              }}
              className={styles.chatPrompt}
            />
          </Flex>
        </Space>
      )}
    </div>
  );
  const chatSender = (
    <>
      <Sender
        value={inputValue}
        onSubmit={() => {
          onSubmit(inputValue);
          setInputValue('');
        }}
        onChange={setInputValue}
        onCancel={() => {
          abortController.current?.abort();
        }}
        prefix={
          <Button
            type="text"
            icon={<SearchOutlined style={{ fontSize: 18 }} />}
          />
        }
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
    </>
  );

  return (
    <div className={styles.layout}>
      {chatSider}

      <div className={styles.chat}>
        {chatList}
        {chatSender}
      </div>
    </div>
  );
};

export default Chat;