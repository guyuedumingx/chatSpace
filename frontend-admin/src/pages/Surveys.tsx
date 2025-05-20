import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Space, Progress, Row, Col, Statistic, Tabs, Select } from 'antd';
import type { TabsProps } from 'antd';
import { SmileOutlined, FrownOutlined, CommentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface SurveyData {
  id: string;
  time: string;
  sessionKey: string;
  branch: string;
  solved: 'yes' | 'no';
  comment?: string;
  userId?: string;
}

// 模拟满意度调查数据
const mockSurveyData: SurveyData[] = [
  {
    id: '1',
    time: '2023-11-16 10:23:45',
    sessionKey: 'session-1-20231116102345',
    branch: '总行营业部',
    solved: 'yes',
  },
  {
    id: '2',
    time: '2023-11-16 11:12:33',
    sessionKey: 'session-2-20231116111233',
    branch: '金融中心支行',
    solved: 'yes',
    comment: '客服非常专业，解决问题很快',
  },
  {
    id: '3',
    time: '2023-11-16 13:45:21',
    sessionKey: 'session-3-20231116134521',
    branch: '城东支行',
    solved: 'no',
    comment: '问题太复杂，需要人工处理',
  },
  {
    id: '4',
    time: '2023-11-16 14:03:40',
    sessionKey: 'session-4-20231116140340',
    branch: '沿江支行',
    solved: 'yes',
  },
  {
    id: '5',
    time: '2023-11-16 15:05:55',
    sessionKey: 'session-5-20231116150555',
    branch: '城西支行',
    solved: 'no',
    comment: '需要提供更具体的信息',
  },
  {
    id: '6',
    time: '2023-11-16 16:11:22',
    sessionKey: 'session-6-20231116161122',
    branch: '南湖支行',
    solved: 'yes',
    comment: '很满意，非常好用的服务',
  },
  {
    id: '7',
    time: '2023-11-16 17:09:48',
    sessionKey: 'session-7-20231116170948',
    branch: '北区支行',
    solved: 'yes',
  },
];

// 模拟总计数据
const mockSummaryData = {
  totalSurveys: 124,
  resolvedRate: 87.9,
  todaySurveys: 28,
  todayResolvedRate: 92.3,
  branches: [
    { name: '总行营业部', count: 35, resolvedRate: 91.4 },
    { name: '金融中心支行', count: 28, resolvedRate: 89.3 },
    { name: '城东支行', count: 16, resolvedRate: 81.3 },
    { name: '沿江支行', count: 15, resolvedRate: 93.3 },
    { name: '城西支行', count: 12, resolvedRate: 83.3 },
    { name: '南湖支行', count: 10, resolvedRate: 90.0 },
    { name: '北区支行', count: 8, resolvedRate: 87.5 },
  ],
};

const Surveys: React.FC = () => {
  const [surveys, setSurveys] = useState<SurveyData[]>(mockSurveyData);
  const [summaryData] = useState(mockSummaryData);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [solvedFilter, setSolvedFilter] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    // 这里应该从API获取数据
    // 暂时使用模拟数据
  }, []);

  // 日期范围选择器配置
  const disabledDate: RangePickerProps['disabledDate'] = (current: Dayjs | null) => {
    return current ? current.valueOf() > Date.now() : false;
  };

  // 调查表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '分支机构',
      dataIndex: 'branch',
      key: 'branch',
    },
    {
      title: '会话标识',
      dataIndex: 'sessionKey',
      key: 'sessionKey',
      ellipsis: true,
    },
    {
      title: '是否解决问题',
      dataIndex: 'solved',
      key: 'solved',
      render: (solved: 'yes' | 'no') => (
        <span style={{ color: solved === 'yes' ? '#52c41a' : '#ff4d4f' }}>
          {solved === 'yes' ? <SmileOutlined /> : <FrownOutlined />} {solved === 'yes' ? '是' : '否'}
        </span>
      ),
    },
    {
      title: '备注',
      dataIndex: 'comment',
      key: 'comment',
      render: (comment?: string) => comment || '无',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: SurveyData) => (
        <Space size="middle">
          <a href={`/conversations/${record.sessionKey}`}>查看对话</a>
          <a href={`/surveys/${record.id}/details`}>详情</a>
        </Space>
      ),
    },
  ];

  // 分支机构满意度表格列定义
  const branchColumns = [
    {
      title: '分支机构',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '调查数量',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: typeof summaryData.branches[0], b: typeof summaryData.branches[0]) => a.count - b.count,
    },
    {
      title: '解决率',
      dataIndex: 'resolvedRate',
      key: 'resolvedRate',
      sorter: (a: typeof summaryData.branches[0], b: typeof summaryData.branches[0]) => a.resolvedRate - b.resolvedRate,
      render: (rate: number) => <Progress percent={rate} size="small" />,
    },
  ];

  // 处理筛选
  const handleFilter = () => {
    let filteredData = [...mockSurveyData];
    
    // 应用分支机构筛选
    if (branchFilter) {
      filteredData = filteredData.filter(item => item.branch === branchFilter);
    }
    
    // 应用解决状态筛选
    if (solvedFilter) {
      filteredData = filteredData.filter(item => item.solved === solvedFilter);
    }
    
    // 应用日期筛选（实际应用中应该从后端获取筛选后的数据）
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      console.log('筛选日期范围:', startDate, '至', endDate);
    }
    
    setSurveys(filteredData);
  };

  // 重置筛选
  const handleReset = () => {
    setBranchFilter(null);
    setSolvedFilter(null);
    setDateRange(null);
    setSurveys(mockSurveyData);
  };

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: '调查结果列表',
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Select
              placeholder="分支机构"
              style={{ width: 150 }}
              allowClear
              onChange={value => setBranchFilter(value)}
              options={summaryData.branches.map(branch => ({ value: branch.name, label: branch.name }))}
              value={branchFilter}
            />
            <Select
              placeholder="解决状态"
              style={{ width: 120 }}
              allowClear
              onChange={value => setSolvedFilter(value)}
              options={[
                { value: 'yes', label: '已解决' },
                { value: 'no', label: '未解决' },
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
            dataSource={surveys}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </>
      ),
    },
    {
      key: '2',
      label: '分支机构统计',
      children: (
        <Table
          columns={branchColumns}
          dataSource={summaryData.branches}
          rowKey="name"
          pagination={false}
        />
      ),
    },
  ];

  return (
    <div>
      <h2>满意度调查统计</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="总调查数"
              value={summaryData.totalSurveys}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="总体解决率"
              value={summaryData.resolvedRate}
              suffix="%"
              precision={1}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="今日调查数"
              value={summaryData.todaySurveys}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="今日解决率"
              value={summaryData.todayResolvedRate}
              suffix="%"
              precision={1}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Card bordered={false}>
        <Tabs defaultActiveKey="1" items={items} />
      </Card>
    </div>
  );
};

export default Surveys; 