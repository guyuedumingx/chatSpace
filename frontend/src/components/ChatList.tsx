import {
  CloseOutlined,
  CopyOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { Bubble, Prompts, Welcome } from '@ant-design/x';
import type { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';
import { Button, Flex, Space, Spin, message, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import logo from '@/assets/logo.svg';
import bot from '@/assets/bot.svg';

// 扩展BubbleDataType以确保类型兼容性
interface ExtendedBubbleDataType extends BubbleDataType {
  role: string; // 确保role是必需的
  content: string; // 确保content是必需的，且是字符串类型
  custom_prompts?: Array<{
    description: string;
  }>;
}

// 使用与页面组件兼容的MessageInfo类型
type MessageInfo = {
  id: string; // 确保id是string类型
  message: ExtendedBubbleDataType;
  status: 'success' | 'loading' | 'error';
};

interface HotTopicItem {
  key: string;
  description: string;
  icon?: string | React.ReactNode;
  children?: HotTopicItem[];
}

interface ChatListProps {
  messages: MessageInfo[];
  hotTopics: HotTopicItem[];
  onSubmit: (val: string) => void;
  handleCustomPromptClick: (promptText: string) => void;
}

const useStyle = createStyles(({ css }) => {
  return {
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
    customPrompts: css`
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    `,
    customPromptItem: css`
      background-color: #f0f0f0;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.3s;
      
      &:hover {
        background-color: #e0e0e0;
      }
    `,
  };
});

const ChatList: React.FC<ChatListProps> = ({
  messages,
  hotTopics,
  onSubmit,
  handleCustomPromptClick,
  handleEndChat,
}) => {
  const { styles } = useStyle();
  const [messageApi, contextHolder] = message.useMessage();

  const renderCustomPrompts = (msg: ExtendedBubbleDataType) => {
    if (!msg.custom_prompts || msg.custom_prompts.length === 0) {
      return null;
    }

    return (
      <div className={styles.customPrompts}>
        {msg.custom_prompts.map((prompt) => (
          <div
            key={prompt.description}
            className={styles.customPromptItem}
            onClick={() => handleCustomPromptClick(prompt.description)}
          >
            {prompt.description}
          </div>
        ))}
      </div>
    );
  };

  type BubbleListItem = {
    id?: string;
    role?: string;
    content: string | React.ReactNode;
    classNames?: { content?: string };
    typing?: boolean | { step?: number; interval?: number };
  };

  if (messages && messages.length > 0) {
    return (
      <div className={styles.chatList}>
        <Bubble.List
          items={messages.map((msgInfo): BubbleListItem => {
            const hasCustomPrompts = 
              msgInfo.message.custom_prompts && 
              msgInfo.message.custom_prompts.length > 0;
            
            // 确保content转换为字符串，防止为空
            const contentStr = String(msgInfo.message.content || '');
            
            return {
              id: String(msgInfo.id),
              role: msgInfo.message.role,
              content: hasCustomPrompts ? (
                <div>
                  <div>{contentStr}</div>
                  {renderCustomPrompts(msgInfo.message)}
                </div>
              ) : contentStr,
              classNames: {
                content: msgInfo.status === 'loading' ? styles.loadingMessage : '',
              },
              typing: msgInfo.status === 'loading' ? { step: 5, interval: 20 } : false,
            };
          })}
          style={{ height: '100%', overflow: 'auto', scrollbarWidth: 'none' }}
          autoScroll
          roles={{
            assistant: {
              placement: 'start',
              avatar: <img src={bot} alt="bot" width={24} height={24} />,
              footer: (content) => {
                let contentText = '';
                
                if (typeof content === 'string') {
                  contentText = content;
                }
                
                return (
                  <div>
                    <div style={{ fontSize: 12, color: '#000000a6', marginLeft: 5 }}>
                      本平台仅供内部使用，严禁发送任何客户信息/涉密信息/敏感信息
                    </div>
                    <div style={{ display: 'flex' }}>
                      <Tooltip title="复制">
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          title="复制"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (contentText) {
                            navigator.clipboard.writeText(contentText);
                            messageApi.success('复制成功');
                          }
                          }}
                        />
                      </Tooltip>
                      {/* <Tooltip title="满意">
                        <Button type="text" size="small" icon={<LikeOutlined />} title="满意" />
                      </Tooltip> */}
                      <Tooltip title="结束对话">
                        <Button type="text" size="small" icon={<CloseOutlined />} onClick={handleEndChat} />
                      </Tooltip>
                    </div>
                  </div>
                );
              },
              loadingRender: () => <Spin size="small" />,
            },
            user: { placement: 'end', avatar: <img src={logo} alt="logo" width={24} height={24} /> },
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.chatList}>
      {contextHolder}
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
            items={hotTopics?.map((item: HotTopicItem, index: number) => ({
              key: item.key,
              description: item.description,
              icon: typeof item.icon === 'string' ? item.icon : item.icon || <>{index + 1}</>,
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
              const promptData = info.data as HotTopicItem;
              if (promptData.description) {
                onSubmit(promptData.description as string);
              }
            }}
            className={styles.chatPrompt}
          />
        </Flex>
      </Space>
    </div>
  );
};

export default ChatList; 