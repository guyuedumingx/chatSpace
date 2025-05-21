import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Space, Tag, Select, Input, Modal, Row, Col, Divider, Badge, Tooltip, Progress, Cascader } from 'antd';
import { SearchOutlined, CommentOutlined, ClockCircleOutlined, InfoCircleOutlined, ShopOutlined, FileTextOutlined } from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { Key } from 'react';

const { RangePicker } = DatePicker;

interface ConversationData {
  id: string;
  time: string;
  branchId: string;  // 机构号
  branchName: string;  // 一级分行名称
  subBranchName: string;  // 网点名称
  topic: string;
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

// 分行选项
interface BranchOption {
  value: string;
  label: string;
}

// 网点选项
interface SubBranchOption {
  value: string;
  label: string;
  parentId: string;
}

// 模拟对话数据
const mockConversationData: ConversationData[] = [
  {
    id: 'session-1-20231116102345',
    time: '2023-11-16 10:23:45',
    branchId: '1001001',
    branchName: '北京分行',
    subBranchName: '朝阳支行',
    topic: '企业开户咨询',
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
    branchName: '金融中心支行',
    subBranchName: '金融中心支行',
    topic: '对公转账限额',
    satisfaction: {
      solved: 'yes',
      timestamp: '2023-11-16 11:17:03'
    }
  },
  {
    id: 'session-3-20231116134521',
    time: '2023-11-16 13:45:21',
    branchId: '3',
    branchName: '城东支行',
    subBranchName: '城东支行',
    topic: '网银开通流程',
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
    branchName: '总行营业部',
    subBranchName: '总行营业部',
    topic: '理财产品咨询',
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
    branchName: '城西支行',
    subBranchName: '城西支行',
    topic: '密码重置问题',
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
    branchName: '南湖支行',
    subBranchName: '南湖支行',
    topic: '贷款申请咨询',
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
    branchName: '北区支行',
    subBranchName: '北区支行',
    topic: '企业理财产品'
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
  const [solvedFilter, setSolvedFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSurveyModalVisible, setIsSurveyModalVisible] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<MessageData[]>([]);
  const [currentSurvey, setCurrentSurvey] = useState<ConversationData['satisfaction'] | null>(null);
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null); // 选中的分行
  const [branchIdFilter, setBranchIdFilter] = useState<string>(''); // 机构号筛选
  
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

  // 获取网点层级结构数据
  useEffect(() => {
    fetchBranchOptions();
  }, []);

  const fetchBranchOptions = async () => {
    try {
      // TODO: 后端接口对接
      // 接口路径: /api/v1/admin/branches/hierarchy
      // 请求方法: GET
      // 返回格式: BranchOption[]
      
      // 模拟层级结构数据
      const mockBranchOptions: BranchOption[] = [
        { value: '1001', label: '北京分行' },
        { value: '1002', label: '上海分行' },
        { value: '1003', label: '广州分行' }
      ];
      
      const mockSubBranchOptions: SubBranchOption[] = [
        { value: '1001001', label: '朝阳支行', parentId: '1001' },
        { value: '1001002', label: '海淀支行', parentId: '1001' },
        { value: '1002001', label: '浦东支行', parentId: '1002' },
        { value: '1002002', label: '黄浦支行', parentId: '1002' }
      ];
      
      setBranchOptions(mockBranchOptions);
    } catch (err) {
      console.error('获取网点层级结构失败:', err);
    }
  };

  // 处理网点层级选择
  const handleBranchChange = (value: string[]) => {
    setSelectedBranch(value[value.length - 1]);
    if (value && value.length > 0) {
      setBranchFilter(value[value.length - 1]);
    } else {
      setBranchFilter(null);
    }
  };

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
      title: '机构号',
      dataIndex: 'branchId',
      key: 'branchId',
      width: 120,
    },
    {
      title: '一级分行',
      dataIndex: 'branchName',
      key: 'branchName',
      width: 150,
      render: (text: string, record: ConversationData) => (
        <a onClick={() => navigate(`/branches?id=${record.branchId}`)}>{text}</a>
      ),
    },
    {
      title: '网点',
      dataIndex: 'subBranchName',
      key: 'subBranchName',
      width: 150,
    },
    {
      title: '主题',
      dataIndex: 'topic',
      key: 'topic',
      width: 180,
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
            text={satisfaction.solved === 'yes' ? '已解决' : '未解决'}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: ConversationData) => (
        <Space size="middle">
          <a onClick={() => showConversationDetail(record.id)}>查看对话</a>
        </Space>
      ),
    },
  ];

  // 处理筛选
  const handleFilter = () => {
    let filtered = [...mockConversationData];
    
    // 机构号筛选
    if (branchIdFilter) {
      filtered = filtered.filter(conv => 
        conv.branchId.includes(branchIdFilter)
      );
    }
    
    // 分行筛选
    if (selectedBranch) {
      filtered = filtered.filter(conv => 
        conv.branchName === selectedBranch
      );
    }
    
    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (solvedFilter) {
      if (solvedFilter === 'yes') {
        filtered = filtered.filter(conv => conv.satisfaction?.solved === 'yes');
      } else if (solvedFilter === 'no') {
        filtered = filtered.filter(conv => conv.satisfaction?.solved === 'no');
      } else if (solvedFilter === 'none') {
        filtered = filtered.filter(conv => !conv.satisfaction);
      }
    }
    
    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(conv => {
        const convDate = new Date(conv.time);
        return convDate >= new Date(start) && convDate <= new Date(end);
      });
    }
    
    setConversations(filtered);
  };

  const handleReset = () => {
    setSelectedBranch(null);
    setBranchIdFilter('');
    setSearchTerm('');
    setBranchFilter(null);
    setSolvedFilter(null);
    setDateRange(null);
    setConversations(mockConversationData);
  };

  // 显示对话详情
  const showConversationDetail = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // 这里应该从API获取对话消息数据
    // 暂时使用模拟数据
    setCurrentMessages(mockMessageData[conversationId] || []);
    setIsModalVisible(true);
  };
  
  // 找到当前会话
  const currentConversation = currentConversationId 
    ? mockConversationData.find(c => c.id === currentConversationId) 
    : null;

  return (
    <div>
      <h2>对话记录</h2>
      
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="选择分行"
            style={{ width: 150 }}
            value={selectedBranch}
            onChange={value => {
              setSelectedBranch(value);
            }}
            options={branchOptions}
            allowClear
          />
          
          <Input
            placeholder="机构号"
            value={branchIdFilter}
            onChange={e => setBranchIdFilter(e.target.value)}
            style={{ width: 120 }}
          />
          
          <Select
            placeholder="满意度"
            style={{ width: 120 }}
            allowClear
            value={solvedFilter || undefined}
            onChange={value => setSolvedFilter(value)}
            options={[
              { value: 'yes', label: '已解决' },
              { value: 'no', label: '未解决' },
              { value: 'none', label: '未评价' }
            ]}
          />
          
          <RangePicker 
            format="YYYY-MM-DD"
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')]);
              } else {
                setDateRange(null);
              }
            }}
          />
          
          <Input 
            placeholder="搜索对话主题/ID" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
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
            {currentSurvey && (
              <Tag 
                color={currentSurvey.solved === 'yes' ? 'success' : 'error'}
                style={{ marginLeft: 8 }}
              >
                {currentSurvey.solved === 'yes' ? '已解决' : '未解决'}
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
        {currentConversation && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <span style={{ fontWeight: 'bold' }}><ClockCircleOutlined /> 时间：</span>
                {currentConversation.time}
              </Col>
              <Col span={8}>
                <span style={{ fontWeight: 'bold' }}><ShopOutlined /> 一级分行：</span>
                <a onClick={() => navigate(`/branches?id=${currentConversation.branchId}`)}>
                  {currentConversation.branchName}
                </a>
              </Col>
              <Col span={8}>
                <span style={{ fontWeight: 'bold' }}><ShopOutlined /> 网点：</span>
                {currentConversation.subBranchName}
              </Col>
            </Row>
            
            <Divider />
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
              {currentMessages.map(message => (
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
            
            {currentConversation.satisfaction && (
              <div style={{ marginTop: 16, padding: '10px', background: '#f9f9f9', borderRadius: 4 }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}><FileTextOutlined /> 满意度反馈：</span>
                  <Tag color={currentConversation.satisfaction.solved === 'yes' ? 'success' : 'error'}>
                    {currentConversation.satisfaction.solved === 'yes' ? '已解决问题' : '未解决问题'}
                  </Tag>
                  <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                    {currentConversation.satisfaction.timestamp}
                  </span>
                </div>
                
                {currentConversation.satisfaction.comment && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>用户意见：</span>
                    <div style={{ marginTop: 4 }}>{currentConversation.satisfaction.comment}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Conversations; 