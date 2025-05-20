import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Space, Tag, Select, Input, Modal, Row, Col, Divider, Badge, Tooltip, Progress } from 'antd';
import { SearchOutlined, CommentOutlined, ClockCircleOutlined, InfoCircleOutlined, ShopOutlined, FileTextOutlined } from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'react';

const { RangePicker } = DatePicker;

interface ConversationData {
  id: string;
  time: string;
  branchId: string;  // 修改为分支机构ID
  branch: string;
  topic: string;
  messages: number;
  duration: string;
  status: 'active' | 'ended' | 'timeout';
  satisfaction?: {
    solved: 'yes' | 'no';
    comment?: string;
    timestamp: string;
  };
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
    branchId: '1',
    branch: '总行营业部',
    topic: '企业开户咨询',
    messages: 8,
    duration: '5分钟12秒',
    status: 'ended',
    satisfaction: {
      solved: 'yes',
      comment: '解答很清晰，感谢帮助！',
      timestamp: '2023-11-16 10:30:12'
    }
  },
  {
    id: 'session-2-20231116111233',
    time: '2023-11-16 11:12:33',
    branchId: '2',
    branch: '金融中心支行',
    topic: '对公转账限额',
    messages: 6,
    duration: '3分钟45秒',
    status: 'ended',
    satisfaction: {
      solved: 'yes',
      timestamp: '2023-11-16 11:17:03'
    }
  },
  {
    id: 'session-3-20231116134521',
    time: '2023-11-16 13:45:21',
    branchId: '3',
    branch: '城东支行',
    topic: '网银开通流程',
    messages: 12,
    duration: '8分钟33秒',
    status: 'ended',
    satisfaction: {
      solved: 'no',
      comment: '问题太复杂，需要人工处理',
      timestamp: '2023-11-16 13:54:30'
    }
  },
  {
    id: 'session-4-20231116140340',
    time: '2023-11-16 14:03:40',
    branchId: '1',
    branch: '总行营业部',
    topic: '理财产品咨询',
    messages: 10,
    duration: '7分钟22秒',
    status: 'ended',
    satisfaction: {
      solved: 'yes',
      comment: '非常满意，谢谢！',
      timestamp: '2023-11-16 14:11:15'
    }
  },
  {
    id: 'session-5-20231116150555',
    time: '2023-11-16 15:05:55',
    branchId: '5',
    branch: '城西支行',
    topic: '密码重置问题',
    messages: 4,
    duration: '2分钟18秒',
    status: 'timeout',
    satisfaction: {
      solved: 'no',
      comment: '需要提供更具体的信息',
      timestamp: '2023-11-16 15:10:25'
    }
  },
  {
    id: 'session-6-20231116161122',
    time: '2023-11-16 16:11:22',
    branchId: '6',
    branch: '南湖支行',
    topic: '贷款申请咨询',
    messages: 15,
    duration: '11分钟5秒',
    status: 'ended',
    satisfaction: {
      solved: 'yes',
      comment: '很满意，非常好用的服务',
      timestamp: '2023-11-16 16:23:10'
    }
  },
  {
    id: 'session-7-20231116170948',
    time: '2023-11-16 17:09:48',
    branchId: '7',
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
  const [solvedFilter, setSolvedFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSurveyModalVisible, setIsSurveyModalVisible] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationData | null>(null);
  const [messageData, setMessageData] = useState<MessageData[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // 从URL查询参数获取branchId
    const params = new URLSearchParams(location.search);
    const branchId = params.get('branchId');
    
    if (branchId) {
      setBranchFilter(branchId);
      // 立即应用筛选
      const filteredData = mockConversationData.filter(item => item.branchId === branchId);
      setConversations(filteredData);
    } else {
      setConversations(mockConversationData);
    }
  }, [location]);

  // 日期范围选择器配置
  const disabledDate: RangePickerProps['disabledDate'] = (current: Dayjs | null) => {
    return current ? current.valueOf() > Date.now() : false;
  };

  // 表格列定义
  const columns: ColumnsType<ConversationData> = [
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
      render: (text: string, record: ConversationData) => (
        <a onClick={() => navigate(`/branches?id=${record.branchId}`)}>{text}</a>
      ),
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
      title: (
        <span>
          满意度 
          <Tooltip title="用户对本次对话的满意度评价">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      width: 100,
      render: (satisfaction?: ConversationData['satisfaction']) => {
        if (!satisfaction) return <Tag color="default">未评价</Tag>;
        
        return (
          <Badge 
            status={satisfaction.solved === 'yes' ? 'success' : 'error'} 
            text={
              <a onClick={() => showSurveyDetail(satisfaction)}>
                {satisfaction.solved === 'yes' ? '已解决' : '未解决'}
              </a>
            } 
          />
        );
      },
      filters: [
        { text: '已解决', value: 'yes' },
        { text: '未解决', value: 'no' },
        { text: '未评价', value: 'none' },
      ],
      onFilter: (value: boolean | Key, record: ConversationData) => {
        if (value === 'none') return !record.satisfaction;
        return record.satisfaction?.solved === value;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: ConversationData) => (
        <Space size="middle">
          <a onClick={() => showConversationDetail(record.id)}>查看对话</a>
          {record.satisfaction && (
            <a onClick={() => showSurveyDetail(record.satisfaction)}>满意度详情</a>
          )}
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
      filteredData = filteredData.filter(item => item.branchId === branchFilter);
    }
    
    // 应用状态筛选
    if (statusFilter) {
      filteredData = filteredData.filter(item => item.status === statusFilter);
    }
    
    // 应用满意度筛选
    if (solvedFilter) {
      if (solvedFilter === 'none') {
        filteredData = filteredData.filter(item => !item.satisfaction);
      } else {
        filteredData = filteredData.filter(
          item => item.satisfaction?.solved === solvedFilter
        );
      }
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
    setSolvedFilter(null);
    setDateRange(null);
    setSearchTerm('');
    setConversations(mockConversationData);
    
    // 清除URL参数
    navigate('/conversations');
  };

  // 显示对话详情
  const showConversationDetail = (conversationId: string) => {
    setSelectedConversation(mockConversationData.find(c => c.id === conversationId) || null);
    // 这里应该从API获取对话消息数据
    // 暂时使用模拟数据
    setMessageData(mockMessageData[conversationId] || []);
    setIsModalVisible(true);
  };
  
  // 显示满意度调查详情
  const showSurveyDetail = (satisfaction: ConversationData['satisfaction']) => {
    if (!satisfaction) return;
    
    const conversation = mockConversationData.find(
      c => c.satisfaction?.timestamp === satisfaction.timestamp
    );
    setSelectedConversation(conversation || null);
    setIsSurveyModalVisible(true);
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
            options={Array.from(new Set(mockConversationData.map(item => item.branchId))).map(branchId => {
              const branch = mockConversationData.find(item => item.branchId === branchId);
              return { value: branchId, label: branch?.branch || branchId };
            })}
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
          <Select
            placeholder="满意度"
            style={{ width: 120 }}
            allowClear
            onChange={value => setSolvedFilter(value)}
            options={[
              { value: 'yes', label: '已解决' },
              { value: 'no', label: '未解决' },
              { value: 'none', label: '未评价' },
            ]}
            value={solvedFilter}
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
      
      {/* 对话详情弹窗 */}
      <Modal
        title={
          <div>
            <span>对话详情</span>
            {selectedConversation?.satisfaction && (
              <Tag 
                color={selectedConversation.satisfaction.solved === 'yes' ? 'success' : 'error'}
                style={{ marginLeft: 8 }}
              >
                {selectedConversation.satisfaction.solved === 'yes' ? '已解决' : '未解决'}
              </Tag>
            )}
          </div>
        }
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
        {selectedConversation && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <span style={{ fontWeight: 'bold' }}><ClockCircleOutlined /> 时间：</span>
                {selectedConversation.time}
              </Col>
              <Col span={8}>
                <span style={{ fontWeight: 'bold' }}><ShopOutlined /> 分支机构：</span>
                <a onClick={() => navigate(`/branches?id=${selectedConversation.branchId}`)}>
                  {selectedConversation.branch}
                </a>
              </Col>
              <Col span={8}>
                <span style={{ fontWeight: 'bold' }}><CommentOutlined /> 主题：</span>
                {selectedConversation.topic}
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
            
            {selectedConversation.satisfaction && (
              <div style={{ marginTop: 16, padding: '10px', background: '#f9f9f9', borderRadius: 4 }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}><FileTextOutlined /> 满意度反馈：</span>
                  <Tag color={selectedConversation.satisfaction.solved === 'yes' ? 'success' : 'error'}>
                    {selectedConversation.satisfaction.solved === 'yes' ? '已解决问题' : '未解决问题'}
                  </Tag>
                  <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                    {selectedConversation.satisfaction.timestamp}
                  </span>
                </div>
                
                {selectedConversation.satisfaction.comment && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>用户意见：</span>
                    <div style={{ marginTop: 4 }}>{selectedConversation.satisfaction.comment}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* 满意度详情弹窗 */}
      <Modal
        title="满意度调查详情"
        open={isSurveyModalVisible}
        onCancel={() => setIsSurveyModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsSurveyModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedConversation?.satisfaction && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <span style={{ fontWeight: 'bold' }}><ShopOutlined /> 分支机构：</span>
                {selectedConversation.branch}
              </Col>
              <Col span={12}>
                <span style={{ fontWeight: 'bold' }}><ClockCircleOutlined /> 提交时间：</span>
                {selectedConversation.satisfaction.timestamp}
              </Col>
            </Row>
            
            <Divider />
            
            <div style={{ marginBottom: 16 }}>
              <Progress 
                type="circle" 
                percent={selectedConversation.satisfaction?.solved === 'yes' ? 100 : 0} 
                format={() => selectedConversation.satisfaction?.solved === 'yes' ? '已解决' : '未解决'}
                status={selectedConversation.satisfaction?.solved === 'yes' ? 'success' : 'exception'}
                width={80}
              />
              <div style={{ marginTop: 16 }}>
                <span style={{ fontWeight: 'bold' }}>问题解决情况：</span>
                <span>
                  {selectedConversation.satisfaction?.solved === 'yes' ? '用户表示问题已解决' : '用户表示问题未解决'}
                </span>
              </div>
            </div>
            
            {selectedConversation.satisfaction?.comment && (
              <div>
                <span style={{ fontWeight: 'bold' }}>用户意见与建议：</span>
                <div style={{ 
                  marginTop: 8, 
                  padding: 16, 
                  background: '#f9f9f9', 
                  borderRadius: 4, 
                  borderLeft: `4px solid ${selectedConversation.satisfaction?.solved === 'yes' ? '#52c41a' : '#ff4d4f'}`
                }}>
                  {selectedConversation.satisfaction?.comment}
                </div>
              </div>
            )}
            
            <Divider />
            
            <div>
              <Button type="primary" onClick={() => showConversationDetail(selectedConversation.id)}>
                查看相关对话
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={() => navigate(`/branches?id=${selectedConversation.branchId}`)}>
                查看分支机构
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Conversations; 