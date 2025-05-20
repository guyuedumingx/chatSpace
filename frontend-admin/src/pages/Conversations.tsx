import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Space, Tag, Select, Input, Modal, Row, Col, Divider } from 'antd';
import { SearchOutlined, UserOutlined, CommentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface ConversationData {
  id: string;
  time: string;
  branch: string;
  topic: string;
  messages: number;
  duration: string;
  status: 'active' | 'ended' | 'timeout';
  satisfaction?: 'yes' | 'no';
}

interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// 模拟对话数据
const mockConversationData: ConversationData[] = [
  {
    id: 'session-1-20231116102345',
    time: '2023-11-16 10:23:45',
    branch: '总行营业部',
    topic: '企业开户咨询',
    messages: 8,
    duration: '5分钟12秒',
    status: 'ended',
    satisfaction: 'yes',
  },
  {
    id: 'session-2-20231116111233',
    time: '2023-11-16 11:12:33',
    branch: '金融中心支行',
    topic: '对公转账限额',
    messages: 6,
    duration: '3分钟45秒',
    status: 'ended',
    satisfaction: 'yes',
  },
  {
    id: 'session-3-20231116134521',
    time: '2023-11-16 13:45:21',
    branch: '城东支行',
    topic: '网银开通流程',
    messages: 12,
    duration: '8分钟33秒',
    status: 'ended',
    satisfaction: 'no',
  },
  {
    id: 'session-4-20231116140340',
    time: '2023-11-16 14:03:40',
    branch: '沿江支行',
    topic: '理财产品咨询',
    messages: 10,
    duration: '7分钟22秒',
    status: 'ended',
    satisfaction: 'yes',
  },
  {
    id: 'session-5-20231116150555',
    time: '2023-11-16 15:05:55',
    branch: '城西支行',
    topic: '密码重置问题',
    messages: 4,
    duration: '2分钟18秒',
    status: 'timeout',
    satisfaction: 'no',
  },
  {
    id: 'session-6-20231116161122',
    time: '2023-11-16 16:11:22',
    branch: '南湖支行',
    topic: '贷款申请咨询',
    messages: 15,
    duration: '11分钟5秒',
    status: 'ended',
    satisfaction: 'yes',
  },
  {
    id: 'session-7-20231116170948',
    time: '2023-11-16 17:09:48',
    branch: '北区支行',
    topic: '企业理财产品',
    messages: 9,
    duration: '6分钟42秒',
    status: 'active',
  },
];

// 模拟消息数据
const mockMessageData: { [key: string]: MessageData[] } = {
  'session-1-20231116102345': [
    {
      id: 'msg1',
      role: 'user',
      content: '你好，我想了解企业开户需要准备哪些材料？',
      timestamp: '2023-11-16 10:23:45',
    },
    {
      id: 'msg2',
      role: 'assistant',
      content: '您好，企业开户需要准备以下材料：1. 营业执照原件及复印件；2. 组织机构代码证原件及复印件；3. 税务登记证原件及复印件；4. 法人身份证原件及复印件；5. 经办人身份证原件及复印件；6. 公司章程；7. 开户许可证。若您已经完成三证合一，则只需要提供新版营业执照。',
      timestamp: '2023-11-16 10:23:48',
    },
    {
      id: 'msg3',
      role: 'user',
      content: '我们已经完成了三证合一，那么除了新版营业执照还需要带什么？',
      timestamp: '2023-11-16 10:24:10',
    },
    {
      id: 'msg4',
      role: 'assistant',
      content: '如果您已完成三证合一，除了新版营业执照外，还需要准备：1. 法人身份证原件及复印件；2. 经办人身份证原件及复印件；3. 公司章程；4. 开户许可证（如果是首次开户则无需提供）；5. 企业公章、财务章和法人章。请问您是首次开立企业账户吗？',
      timestamp: '2023-11-16 10:24:15',
    },
    {
      id: 'msg5',
      role: 'user',
      content: '是的，这是我们公司首次开户',
      timestamp: '2023-11-16 10:24:32',
    },
    {
      id: 'msg6',
      role: 'assistant',
      content: '了解了。作为首次开户，您需要在银行开立基本账户。办理流程大致为：1. 到银行网点提交申请材料；2. 银行审核材料；3. 签订账户管理协议；4. 银行为您核发开户许可证；5. 激活账户并办理网银等配套服务。建议您提前预约网点办理，可以节省等待时间。我们总行营业部和各支行都可以办理企业开户业务，您可以选择就近的网点。',
      timestamp: '2023-11-16 10:24:38',
    },
    {
      id: 'msg7',
      role: 'user',
      content: '好的，谢谢。请问办理大概需要多长时间？',
      timestamp: '2023-11-16 10:24:55',
    },
    {
      id: 'msg8',
      role: 'assistant',
      content: '企业开户的整个流程通常需要1-3个工作日完成。如果您的材料齐全且符合要求，在银行网点的现场办理时间约为1-2小时。开户许可证的获取可能需要1-2个工作日的审核时间。如需更快办理，可以通过我行的企业预约服务提前预约并提交材料，这样可以加快处理速度。若有其他问题，欢迎随时咨询。',
      timestamp: '2023-11-16 10:25:02',
    },
  ],
};

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationData[]>(mockConversationData);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messageData, setMessageData] = useState<MessageData[]>([]);

  useEffect(() => {
    // 这里应该从API获取数据
    // 暂时使用模拟数据
  }, []);

  // 日期范围选择器配置
  const disabledDate: RangePickerProps['disabledDate'] = (current: Dayjs | null) => {
    return current ? current.valueOf() > Date.now() : false;
  };

  // 表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 150,
    },
    {
      title: '分支机构',
      dataIndex: 'branch',
      key: 'branch',
      width: 150,
    },
    {
      title: '主题',
      dataIndex: 'topic',
      key: 'topic',
      width: 180,
    },
    {
      title: '消息数',
      dataIndex: 'messages',
      key: 'messages',
      width: 100,
      sorter: (a: ConversationData, b: ConversationData) => a.messages - b.messages,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let color = 'default';
        let text = '未知';
        
        switch (status) {
          case 'active':
            color = 'processing';
            text = '进行中';
            break;
          case 'ended':
            color = 'success';
            text = '已结束';
            break;
          case 'timeout':
            color = 'warning';
            text = '超时';
            break;
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '满意度',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      width: 100,
      render: (satisfaction?: 'yes' | 'no') => {
        if (!satisfaction) return '未评价';
        return (
          <Tag color={satisfaction === 'yes' ? 'success' : 'error'}>
            {satisfaction === 'yes' ? '满意' : '不满意'}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: ConversationData) => (
        <Space size="middle">
          <a onClick={() => showConversationDetail(record.id)}>查看详情</a>
          <a href={`/conversations/${record.id}/export`}>导出</a>
        </Space>
      ),
    },
  ];

  // 处理筛选
  const handleFilter = () => {
    let filteredData = [...mockConversationData];
    
    // 应用分支机构筛选
    if (branchFilter) {
      filteredData = filteredData.filter(item => item.branch === branchFilter);
    }
    
    // 应用状态筛选
    if (statusFilter) {
      filteredData = filteredData.filter(item => item.status === statusFilter);
    }
    
    // 应用搜索关键词
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredData = filteredData.filter(
        item => item.topic.toLowerCase().includes(term) || item.id.toLowerCase().includes(term)
      );
    }
    
    // 应用日期筛选（实际应用中应该从后端获取筛选后的数据）
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      console.log('筛选日期范围:', startDate, '至', endDate);
    }
    
    setConversations(filteredData);
  };

  // 重置筛选
  const handleReset = () => {
    setBranchFilter(null);
    setStatusFilter(null);
    setDateRange(null);
    setSearchTerm('');
    setConversations(mockConversationData);
  };

  // 显示对话详情
  const showConversationDetail = (conversationId: string) => {
    setCurrentConversation(conversationId);
    // 这里应该从API获取对话消息数据
    // 暂时使用模拟数据
    setMessageData(mockMessageData[conversationId] || []);
    setIsModalVisible(true);
  };

  return (
    <div>
      <h2>对话记录</h2>
      
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索主题/会话ID"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="分支机构"
            style={{ width: 150 }}
            allowClear
            onChange={value => setBranchFilter(value)}
            options={Array.from(new Set(mockConversationData.map(item => item.branch))).map(branch => ({ value: branch, label: branch }))}
            value={branchFilter}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={value => setStatusFilter(value)}
            options={[
              { value: 'active', label: '进行中' },
              { value: 'ended', label: '已结束' },
              { value: 'timeout', label: '超时' },
            ]}
            value={statusFilter}
          />
          <RangePicker 
            disabledDate={disabledDate} 
            onChange={(_, dateStrings) => setDateRange(dateStrings as [string, string])} 
          />
          <Button type="primary" onClick={handleFilter}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
        
        <Table
          columns={columns}
          dataSource={conversations}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>
      
      <Modal
        title="对话详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>,
          <Button key="export" type="primary">
            导出对话
          </Button>,
        ]}
        width={800}
      >
        {currentConversation && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <span style={{ fontWeight: 'bold' }}><ClockCircleOutlined /> 时间：</span>
                {mockConversationData.find(item => item.id === currentConversation)?.time}
              </Col>
              <Col span={8}>
                <span style={{ fontWeight: 'bold' }}><UserOutlined /> 分支机构：</span>
                {mockConversationData.find(item => item.id === currentConversation)?.branch}
              </Col>
              <Col span={8}>
                <span style={{ fontWeight: 'bold' }}><CommentOutlined /> 主题：</span>
                {mockConversationData.find(item => item.id === currentConversation)?.topic}
              </Col>
            </Row>
            
            <Divider />
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
              {messageData.map(message => (
                <div 
                  key={message.id} 
                  style={{ 
                    marginBottom: '16px',
                    textAlign: message.role === 'user' ? 'right' : 'left' 
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      maxWidth: '70%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: message.role === 'user' ? '#e6f7ff' : '#f5f5f5',
                      textAlign: 'left',
                    }}
                  >
                    <div>{message.content}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Conversations; 