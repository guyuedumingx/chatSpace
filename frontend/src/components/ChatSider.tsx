import {
  DeleteOutlined,
  LogoutOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Conversations } from '@ant-design/x';
import type { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';
import type { MessageInfo } from '@ant-design/x/es/use-x-chat';
import { Button, message } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import logo from '@/assets/logo.svg';
import { chatApi } from '@/api/chat';

// 扩展BubbleDataType以确保类型兼容性
interface ExtendedBubbleDataType extends BubbleDataType {
  custom_prompts?: Array<{
    key: string;
    description: string;
  }>;
}

interface ConversationItem {
  key: string;
  label: string;
  group?: string;
}

// 使用通用的MessageInfo类型
type ChatMessageInfo = MessageInfo<ExtendedBubbleDataType>;

interface ChatSiderProps {
  conversations: ConversationItem[];
  curConversation: string;
  orgName: string;
  setConversations: (conversations: ConversationItem[]) => void;
  setCurConversation: (key: string) => void;
  setMessages: (messages: ChatMessageInfo[]) => void;
  abortController: React.MutableRefObject<AbortController | null>;
  handleLogout: () => void;
}

const useStyle = createStyles(({ token, css }) => {
  return {
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
  };
});

const ChatSider: React.FC<ChatSiderProps> = ({
  conversations,
  curConversation,
  orgName,
  setConversations,
  setCurConversation,
  setMessages,
  abortController,
  handleLogout,
}) => {
  const { styles } = useStyle();
  const [messageApi, contextHolder] = message.useMessage();
  const mapApiHistoryToMessageInfo = (history: ExtendedBubbleDataType[]): ChatMessageInfo[] => {
    return history.map((item, index) => ({
      id: item.id || `history-item-${index}`,
      message: { ...item },
      status: 'success',
    }));
  };

  return (
    <div className={styles.sider}>
      {contextHolder}
      <div className={styles.logo}>
        <img src={logo} draggable={false} alt="logo" width={24} height={24} />
        <span>远程核准线上咨询平台</span>
      </div>
      <Button
        onClick={async () => {
          try {
            const newConversation = await chatApi.createConversation(
              `业务咨询 ${conversations.length + 1}`
            ) as ConversationItem;
            setConversations([newConversation, ...conversations]);
            setCurConversation(newConversation.key);
            setMessages([]);
          } catch (error) {
            console.error("Failed to create conversation:", error);
            messageApi.error("创建新会话失败");
          }
        }}
        type="link"
        className={styles.addBtn}
        icon={<PlusOutlined />}
      >
        新建咨询会话
      </Button>
      <Conversations
        items={conversations}
        className={styles.conversations}
        activeKey={curConversation}
        onActiveChange={async (val) => {
          abortController.current?.abort();
          setTimeout(async () => {
            try {
              setCurConversation(val);
              if (val) {
                const historyFromApi = await chatApi.getMessageHistory(val) as ExtendedBubbleDataType[];
                setMessages(mapApiHistoryToMessageInfo(historyFromApi));
              } else {
                setMessages([]);
              }
            } catch (error) {
              console.error("Failed to get message history for key:", val, error);
              messageApi.error("获取历史消息失败");
              setMessages([]);
            }
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
                try {
                  await chatApi.deleteConversation(conversation.key);
                  const newList = conversations.filter((item) => item.key !== conversation.key);
                  setConversations(newList);
                  if (conversation.key === curConversation) {
                    const newKey = newList?.[0]?.key || '';
                    setCurConversation(newKey);
                    if (newKey) {
                      const historyFromApi = await chatApi.getMessageHistory(newKey) as ExtendedBubbleDataType[];
                      setMessages(mapApiHistoryToMessageInfo(historyFromApi));
                    } else {
                      setMessages([]);
                    }
                  }
                } catch (error) {
                  console.error("Failed to delete conversation:", error);
                  messageApi.error("删除会话失败");
                }
              },
            },
          ],
        })}
      />
      <div className={styles.siderFooter}>
        <img src={logo} alt="bot" width={24} height={24} />
        <span>{orgName}</span>
        <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} />
      </div>
    </div>
  );
};

export default ChatSider; 