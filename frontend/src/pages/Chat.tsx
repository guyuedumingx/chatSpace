import { useXAgent, useXChat } from '@ant-design/x';
import type { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';
import { message } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '@/stores/OrgStore';
import { chatApi, API_BASE_URL, BackendMessageItem, MessageHistoryItem } from '@/api/chat';
import ChatSider from '@/components/ChatSider';
import ChatList from '@/components/ChatList';
import ChatSender from '@/components/ChatSender';

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
  };
});

const Chat: React.FC = () => {
  const { styles } = useStyle();
  const navigate = useNavigate();
  const abortController = useRef<AbortController | null>(null);
  const { orgName, logout } = useOrgStore();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [curConversation, setCurConversation] = useState<string>('');
  const [hotTopics, setHotTopics] = useState<HotTopicItem[]>([]);

  // 使用XAgent但忽略具体类型，只关注功能接口
  const [agent] = useXAgent({
    baseURL: API_BASE_URL + '/chat/completions',
    model: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  });
  
  const loading = agent.isRequesting();

  // 使用useXChat，但使用@ts-expect-error暂时忽略类型检查
  // @ts-expect-error - 类型不兼容但功能正常，后续会重构解决
  const { onRequest, messages, setMessages } = useXChat<ExtendedBubbleDataType>({
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

  useEffect(() => {
    const initData = async () => {
      try {
        const [conversationsData, hotTopicsData] = await Promise.all([
          chatApi.getConversations(),
          chatApi.getHotTopics(),
        ]);
        const typedConversations = conversationsData as ConversationItem[];
        const typedHotTopics = hotTopicsData as HotTopicItem[];

        setConversations(typedConversations);
        setHotTopics(typedHotTopics);

        if (typedConversations && typedConversations.length > 0) {
          const firstConversationKey = typedConversations[0].key;
          setCurConversation(firstConversationKey);
          const historyFromApi = await chatApi.getMessageHistory(firstConversationKey) as BackendMessageItem[];
          setMessages(mapApiHistoryToMessageInfo(historyFromApi));
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error("Failed to initialize chat data:", error);
        message.error("初始化聊天数据失败");
        setMessages([]);
      }
    };
    initData();
  }, [setMessages]);

  // 当用户点击自定义提示时，发送提示文本作为新消息
  const handleCustomPromptClick = (promptText: string) => {
    onSubmit(promptText);
  };

  // 处理消息提交
  const onSubmit = (val: string) => {
    if (!val) return;
    if (loading) {
      message.error('请求进行中，请稍后...');
      return;
    }
    
    // 不使用stream，一次性返回结果
    onRequest({ 
      stream: false, 
      message: { role: 'user', content: val } as ExtendedBubbleDataType
    });
    
    // 在用户发送消息后，立即保存到历史记录
    saveMessageHistory(val);
  };

  // 保存聊天历史记录
  const saveMessageHistory = async (userMessage: string) => {
    if (!curConversation) return;
    
    try {
      // 收集成功状态的消息并格式化为正确的类型
      const successMessages: MessageHistoryItem[] = messages
        .filter(m => m.status === 'success')
        .map(m => ({
          id: String(m.id),
          message: {
            role: m.message.role,
            content: m.message.content || '', // 确保content不为undefined
            ...(m.message.custom_prompts ? { custom_prompts: m.message.custom_prompts } : {})
          },
          status: 'success'
        }));
      
      // 创建新用户消息
      const newUserMessage: MessageHistoryItem = {
        id: `msg_${Date.now()}`,
        message: {
          role: 'user',
          content: userMessage
        },
        status: 'success'
      };
      
      // 添加新的用户消息并保存
      const updatedMessages: MessageHistoryItem[] = [
        ...successMessages,
        newUserMessage
      ];
      
      // 调用API保存
      await chatApi.saveMessageHistory(curConversation, updatedMessages);
    } catch (error) {
      console.error("Failed to save message history:", error);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <ChatSider
        conversations={conversations}
        curConversation={curConversation}
        orgName={orgName}
        setConversations={setConversations}
        setCurConversation={setCurConversation}
        // @ts-expect-error - 类型不完全兼容但功能正常
        setMessages={setMessages}
        abortController={abortController}
        handleLogout={handleLogout}
      />
      <div className={styles.chat}>
        <ChatList 
          // @ts-expect-error - 类型不完全兼容但功能正常
          messages={messages}
          hotTopics={hotTopics}
          onSubmit={onSubmit}
          handleCustomPromptClick={handleCustomPromptClick}
        />
        <ChatSender
          onSubmit={onSubmit}
          loading={loading}
          onCancel={() => {
            abortController.current?.abort();
          }}
        />
      </div>
    </div>
  );
};

export default Chat;