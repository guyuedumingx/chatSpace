import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Space, Tag, Select, Input, Modal, Row, Col, Divider, Badge, Tooltip } from 'antd';
import { SearchOutlined, ClockCircleOutlined, InfoCircleOutlined, ShopOutlined, FileTextOutlined } from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { ConversationData, MessageData, BranchOption } from '../types/conversation';
import { conversationApi } from '../api/conversation';

const { RangePicker } = DatePicker;

const Conversations: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [solvedFilter, setSolvedFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  // 以下两个状态变量将在后续功能中使用
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSurveyModalVisible, setIsSurveyModalVisible] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<MessageData[]>([]);
  const [currentSurvey, setCurrentSurvey] = useState<ConversationData['satisfaction'] | null>(null);
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null); // 选中的分行
  const [branchIdFilter, setBranchIdFilter] = useState<string>(''); // 机构号筛选
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // 初始加载数据
  useEffect(() => {
    fetchConversations();
    fetchBranchOptions();
  }, []);
  
  // 从URL查询参数获取branchId
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const branchId = params.get('branchId');
    
    if (branchId) {
      setBranchFilter(branchId);
      setBranchIdFilter(branchId);
      // 重新加载数据
      fetchConversations({ branchId });
    }
  }, [location]);

  // 获取对话列表
  const fetchConversations = async (filters = {}) => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        branchId: branchIdFilter || undefined,
        solvedFilter: solvedFilter || undefined,
        ...(dateRange ? { 
          startDate: dateRange[0], 
          endDate: dateRange[1] 
        } : {}),
        ...filters
      };
      
      const response = await conversationApi.getConversations(params);
      setConversations(response.data);
      setTotal(response.total);
      setCurrentPage(response.page);
      setPageSize(response.pageSize);
    } catch (error) {
      console.error('获取对话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取网点层级结构数据
  const fetchBranchOptions = async () => {
    try {
      const data = await conversationApi.getBranchOptions();
      setBranchOptions(data.branches || []);
    } catch (err) {
      console.error('获取网点层级结构失败:', err);
    }
  };

  // 处理网点层级选择
  const handleBranchChange = (value: string) => {
    setSelectedBranch(value);
    if (value) {
      setBranchFilter(value);
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
      render: (text: string, record: ConversationData) => (
        <span>{dayjs(text).format('YYYY-MM-DD HH:mm:ss')}</span>
      ),
    },
    {
      title: '机构号',
      dataIndex: 'branchId',
      key: 'branchId',
      width: 120,
    },
    // {
    //   title: '一级分行',
    //   dataIndex: 'branchName',
    //   key: 'branchName',
    //   width: 150,
    //   render: (text: string, record: ConversationData) => (
    //     <a onClick={() => navigate(`/branches?id=${record.branchId}`)}>{text}</a>
    //   ),
    // },
    {
      title: '网点名称',
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
      render: (satisfaction: ConversationData['satisfaction'] | undefined) => {
        return (
          <Badge 
            status={satisfaction?.solved === 'yes' ? 'success' : 'error'} 
            text={satisfaction?.solved === 'yes' ? '已解决' : '未解决'}
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
    fetchConversations();
  };

  const handleReset = () => {
    setSelectedBranch(null);
    setBranchIdFilter('');
    setSearchTerm('');
    setBranchFilter(null);
    setSolvedFilter(null);
    setDateRange(null);
    fetchConversations({
      page: 1,
      branchId: undefined,
      searchTerm: undefined,
      solvedFilter: undefined,
      startDate: undefined,
      endDate: undefined
    });
  };

  // 显示对话详情
  const showConversationDetail = async (conversationId: string) => {
    try {
      setCurrentConversationId(conversationId);
      const response = await conversationApi.getConversationDetail(conversationId);
      setCurrentMessages(response.messages || []);
      setCurrentSurvey(response.satisfaction || null);
      setIsModalVisible(true);
    } catch (error) {
      console.error('获取对话详情失败:', error);
    }
  };
  
  // 找到当前会话
  const currentConversation = currentConversationId 
    ? conversations.find(c => c.id === currentConversationId) 
    : null;

  // 分页改变
  const handleTableChange = (pagination: any) => {  // eslint-disable-line @typescript-eslint/no-explicit-any
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    fetchConversations({
      page: pagination.current,
      pageSize: pagination.pageSize
    });
  };

  return (
    <div>
      <h2>对话记录</h2>
      
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          {/* <Select
            placeholder="选择分行"
            style={{ width: 150 }}
            value={selectedBranch}
            onChange={handleBranchChange}
            options={branchOptions}
            allowClear
          /> */}
          
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
              { value: 'no', label: '未解决' }
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
            disabledDate={disabledDate}
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
          pagination={{ 
            pageSize,
            current: currentPage,
            total,
            showSizeChanger: true,
            showQuickJumper: true
          }}
          onChange={handleTableChange}
          loading={loading}
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
                {dayjs(currentConversation.time).format('YYYY-MM-DD HH:mm:ss')}
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
                    {message.prompts && (
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {message.prompts.map((prompt, index) => (
                          <div key={prompt.description}>{index + 1}. {prompt.description}</div>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {currentSurvey && (
              <div style={{ marginTop: 16, padding: '10px', background: '#f9f9f9', borderRadius: 4 }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}><FileTextOutlined /> 满意度反馈：</span>
                  <Tag color={currentSurvey.solved === 'yes' ? 'success' : 'error'}>
                    {currentSurvey.solved === 'yes' ? '已解决问题' : '未解决问题'}
                  </Tag>
                  <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>
                    {dayjs(currentSurvey.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </div>
                
                {currentSurvey.comment && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontWeight: 'bold' }}>用户意见：</span>
                    <div style={{ marginTop: 4 }}>{currentSurvey.comment}</div>
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