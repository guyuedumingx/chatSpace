import { useXAgent, useXChat } from '@ant-design/x';
import type { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';
import { message } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '@/stores/OrgStore';
import { chatApi, BackendMessageItem, ContactInfo } from '@/api/chat';
import { API_BASE_URL } from '@/api/index';
import ChatSider from '@/components/ChatSider';
import ChatList from '@/components/ChatList';
import ChatSender from '@/components/ChatSender';
import SatisfactionSurvey from '@/components/SatisfactionSurvey';
// 扩展BubbleDataType以确保类型兼容性
interface ExtendedBubbleDataType extends BubbleDataType {
  role: string;
  content: string;
  custom_prompts?: Array<{
    key: string;
    description: string;
  }>;
}

// 定义与ChatList兼容的消息类型
type MessageInfo = {
  id: string;
  message: ExtendedBubbleDataType;
  status: 'success' | 'loading' | 'error';
};

interface ConversationItem {
  key: string;
  label: string;
  group?: string;
}

interface HotTopicItem {
  key: string;
  description: string;
  icon?: string | React.ReactNode;
  children?: HotTopicItem[];
}

// 定义chunk的结构
interface MessageChunk {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
      custom_prompts?: Array<{
        key: string;
        description: string;
      }>;
    };
  }>;
}

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
    endBtn: css`
      position: absolute;
      right: 32px;
      top: 32px;
      z-index: 10;
    `
  };
});

const Chat: React.FC = () => {
  const { styles } = useStyle();
  const navigate = useNavigate();
  const abortController = useRef<AbortController | null>(null);
  const { orgName, logout, orgCode } = useOrgStore();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [curConversation, setCurConversation] = useState<string>('');
  const [hotTopics, setHotTopics] = useState<HotTopicItem[]>([]);
  const [messages, setMessages] = useState<MessageInfo[]>([]);
  const [surveyVisible, setSurveyVisible] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({ contactName: '', contactPhone: '' });
  const surveyTimer = useRef<NodeJS.Timeout | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // 发送消息时重置3分钟定时器
  const resetSurveyTimer = () => {
    if (surveyTimer.current) clearTimeout(surveyTimer.current);
    surveyTimer.current = setTimeout(() => {
      handleShowSurvey();
    }, 3 * 60 * 1000);
  };

  // 问卷提交
  const handleSurveySubmit = async (data: { solved: 'yes' | 'no'; comment?: string }) => {
    try {
      await chatApi.submitSurvey({
        ...data,
        chat_id: curConversation,
        // user_id: 可选
      });
      messageApi.success('感谢您的反馈！');
    } catch {
      messageApi.error('提交失败，请稍后重试');
    }
  };

  // 使用XAgent但忽略具体类型，只关注功能接口
  const [agent] = useXAgent({
    baseURL: API_BASE_URL + '/chat/completions',
    model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  });
  
  const loading = agent.isRequesting();

  // 使用useXChat，但使用@ts-expect-error暂时忽略类型检查
  // @ts-expect-error - 类型不兼容但功能正常，后续会重构解决
  const { onRequest, messages: xChatMessages, setMessages: setXChatMessages } = useXChat<ExtendedBubbleDataType>({
    agent,
    requestFallback: (_: unknown, { error }: { error: Error }) => {
      if (error.name === 'AbortError') {
        return { role: 'assistant', content: '请求被中止' } as ExtendedBubbleDataType;
      }
      return { role: 'assistant', content: '请求失败，请重试！' } as ExtendedBubbleDataType;
    },
    transformMessage: (info) => {
      const { chunks } = info || {};
      const chunk = chunks?.[0];
      try {
        if (chunk) {
          // 使用类型断言处理数据
          const messageChunk = chunk as unknown as MessageChunk;
          
          // 从choices[0].message中获取内容和自定义提示
          const assistantMessage = messageChunk.choices?.[0]?.message || {};
          const content = assistantMessage.content || '';
          const customPrompts = assistantMessage.custom_prompts;
          
          // 返回格式化的消息对象
          return {
            role: 'assistant',
            content: content || '无回答',
            ...(customPrompts ? { custom_prompts: customPrompts } : {})
          } as ExtendedBubbleDataType;
        }
        
        // 如果没有数据，返回一个空的回答
        return {
          role: 'assistant',
          content: '无回答'
        } as ExtendedBubbleDataType;
      } catch (e) {
        console.error('Error transforming message:', e);
        return {
          role: 'assistant',
          content: '处理消息时出错，请重试'
        } as ExtendedBubbleDataType;
      }
    },
    resolveAbortController: (controller) => {
      abortController.current = controller;
    },
  });

  // 将后端消息转换为前端消息格式
  const mapApiHistoryToMessageInfo = (history: BackendMessageItem[]): MessageInfo[] => {
    return history.map((item, index) => ({
      id: String(item.id || `history-item-${index}`),
      message: {
        role: item.role || 'unknown',
        content: item.content || '',
        ...(item.custom_prompts ? { custom_prompts: item.custom_prompts } : {})
      } as ExtendedBubbleDataType,
      status: 'success',
    }));
  };

  // 拉取历史
  const fetchHistory = async (conversationKey?: string) => {
    const key = conversationKey || curConversation;
    if (!key) return;
    try {
      const historyFromApi = await chatApi.getMessageHistory(key) as BackendMessageItem[];
      setMessages(mapApiHistoryToMessageInfo(historyFromApi));
    } catch (error) {
      setMessages([]);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [conversationsData, hotTopicsData] = await Promise.all([
          chatApi.getConversations(orgCode),
          chatApi.getHotTopics(),
        ]);
        const typedConversations = conversationsData as ConversationItem[];
        const typedHotTopics = hotTopicsData as HotTopicItem[];

        setConversations(typedConversations);
        setHotTopics(typedHotTopics);

        if (typedConversations && typedConversations.length > 0) {
          const firstConversationKey = typedConversations[0].key;
          setCurConversation(firstConversationKey);
          fetchHistory(firstConversationKey);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error("Failed to initialize chat data:", error);
        messageApi.error("初始化聊天数据失败");
        setMessages([]);
      }
    };
    initData();
  }, []);

  // 切换会话时拉取历史
  useEffect(() => {
    if (curConversation) {
      fetchHistory(curConversation);
    }
    resetSurveyTimer();
    return () => {
      if (surveyTimer.current) clearTimeout(surveyTimer.current);
    };
    // eslint-disable-next-line
  }, [curConversation]);

  // 发送消息
  const onSubmit = async (val: string) => {
    if (!val) return;
    if (loading) {
      messageApi.error('请求进行中，请稍后...');
      return;
    }
    // 1. 本地追加用户消息（loading）
    const userMsg: MessageInfo = {
      id: `msg_${Date.now()}`,
      message: { role: 'user', content: val },
      status: 'loading'
    };
    setMessages(prev => [...prev, userMsg]);

    // 2. 发送到后端，获取assistant回复
    try {
      const assistantMsg = await chatApi.sendMessageToHistory(curConversation, val);
      console.log(assistantMsg)
      // 3. 更新用户消息为success，追加assistant消息
      setMessages(prev => {
        // 把最后一条用户消息的status设为success
        const updated = prev.map((msg, idx) =>
          idx === prev.length - 1 ? { ...msg, status: 'success' } : msg
        );
        // 追加assistant消息
        return [
          ...updated,
          {
            id: assistantMsg.id || `assistant_${Date.now()}`,
            message: {
              role: 'assistant',
              content: assistantMsg.content,
              ...(assistantMsg.custom_prompts ? { custom_prompts: assistantMsg.custom_prompts } : {})
            },
            status: 'success'
          }
        ];
      });
      resetSurveyTimer();
    } catch (e) {
      // 失败时将最后一条用户消息标记为error
      setMessages(prev => prev.map((msg, idx) =>
        idx === prev.length - 1 ? { ...msg, status: 'error' } : msg
      ));
      messageApi.error('发送失败');
    }
  };

  // 自定义提示点击
  const handleCustomPromptClick = (promptText: string) => {
    onSubmit(promptText);
  };

  // 结束对话按钮点击或超时弹窗
  const handleShowSurvey = async () => {
    if (!curConversation) return;
    const info = await chatApi.getContactInfo(curConversation);
    setContactInfo(info);
    setSurveyVisible(true);
  };

  const handleLogout = () => {
    logout();
    messageApi.success('已退出登录');
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      {contextHolder}
      <ChatSider
        conversations={conversations}
        curConversation={curConversation}
        orgName={orgName}
        setConversations={setConversations}
        setCurConversation={setCurConversation}
        setMessages={setMessages}
        abortController={abortController}
        handleLogout={handleLogout}
      />
      <div className={styles.chat}>
        <ChatList 
          messages={messages}
          hotTopics={hotTopics}
          onSubmit={onSubmit}
          handleCustomPromptClick={handleCustomPromptClick}
          handleEndChat={handleShowSurvey}
        />
        <ChatSender
          onSubmit={onSubmit}
          loading={loading}
          onCancel={() => {
            abortController.current?.abort();
          }}
        />
      </div>
      <SatisfactionSurvey
        visible={surveyVisible}
        onClose={() => setSurveyVisible(false)}
        onSubmit={handleSurveySubmit}
        contactName={contactInfo.contactName}
        contactPhone={contactInfo.contactPhone}
      />
    </div>
  );
};

export default Chat;