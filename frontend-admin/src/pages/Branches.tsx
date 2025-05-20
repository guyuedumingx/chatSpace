import React, { useState, useEffect } from 'react';
import { Table, Card, Select, DatePicker, Button, Space, Row, Col, Statistic } from 'antd';
import { ShopOutlined, CommentOutlined, TeamOutlined, StarOutlined } from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface BranchData {
  id: string;
  name: string;
  conversations: number;
  users: number;
  avgSatisfaction: number;
  avgResponseTime: string;
}

interface TotalData {
  totalBranches: number;
  totalConversations: number;
  totalUsers: number;
  avgSatisfaction: number;
}

// 模拟网点数据
const mockBranchesData: BranchData[] = [
  {
    id: '1',
    name: '总行营业部',
    conversations: 583,
    users: 125,
    avgSatisfaction: 4.8,
    avgResponseTime: '1分15秒',
  },
  {
    id: '2',
    name: '金融中心支行',
    conversations: 421,
    users: 98,
    avgSatisfaction: 4.6,
    avgResponseTime: '1分32秒',
  },
  {
    id: '3',
    name: '城东支行',
    conversations: 326,
    users: 72,
    avgSatisfaction: 4.3,
    avgResponseTime: '1分45秒',
  },
  {
    id: '4',
    name: '沿江支行',
    conversations: 285,
    users: 65,
    avgSatisfaction: 4.5,
    avgResponseTime: '1分28秒',
  },
  {
    id: '5',
    name: '城西支行',
    conversations: 245,
    users: 53,
    avgSatisfaction: 4.2,
    avgResponseTime: '1分56秒',
  },
  {
    id: '6',
    name: '南湖支行',
    conversations: 210,
    users: 48,
    avgSatisfaction: 4.7,
    avgResponseTime: '1分22秒',
  },
  {
    id: '7',
    name: '北区支行',
    conversations: 185,
    users: 42,
    avgSatisfaction: 4.4,
    avgResponseTime: '1分38秒',
  },
];

// 模拟总计数据
const mockTotalData: TotalData = {
  totalBranches: 7,
  totalConversations: 2255,
  totalUsers: 503,
  avgSatisfaction: 4.5,
};

const Branches: React.FC = () => {
  const [branches] = useState<BranchData[]>(mockBranchesData);
  const [totalData] = useState<TotalData>(mockTotalData);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

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
      title: '网点名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '对话次数',
      dataIndex: 'conversations',
      key: 'conversations',
      sorter: (a: BranchData, b: BranchData) => a.conversations - b.conversations,
    },
    {
      title: '用户数',
      dataIndex: 'users',
      key: 'users',
      sorter: (a: BranchData, b: BranchData) => a.users - b.users,
    },
    {
      title: '平均满意度',
      dataIndex: 'avgSatisfaction',
      key: 'avgSatisfaction',
      sorter: (a: BranchData, b: BranchData) => a.avgSatisfaction - b.avgSatisfaction,
      render: (rating: number) => {
        const stars = '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '★' : '☆').repeat(1) + '☆'.repeat(4 - Math.floor(rating));
        return <span style={{ color: '#faad14' }}>{stars} ({rating.toFixed(1)})</span>;
      },
    },
    {
      title: '平均响应时间',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: BranchData) => (
        <Space size="middle">
          <a href={`/branches/${record.id}/details`}>详情</a>
          <a href={`/branches/${record.id}/report`}>导出报告</a>
        </Space>
      ),
    },
  ];

  // 处理筛选
  const handleFilter = () => {
    // 这里应该根据筛选条件从API获取数据
    console.log('筛选条件:', { dateRange, selectedBranch });
    // 暂时不做任何操作，使用模拟数据
  };

  return (
    <div>
      <h2>网点统计</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="总网点数"
              value={totalData.totalBranches}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="总对话次数"
              value={totalData.totalConversations}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="总用户数"
              value={totalData.totalUsers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="平均满意度"
              value={totalData.avgSatisfaction}
              prefix={<StarOutlined />}
              precision={1}
            />
          </Card>
        </Col>
      </Row>
      
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="选择网点"
            style={{ width: 200 }}
            allowClear
            onChange={value => setSelectedBranch(value)}
            options={branches.map(branch => ({ value: branch.id, label: branch.name }))}
          />
          <RangePicker disabledDate={disabledDate} onChange={(_, dateStrings) => setDateRange(dateStrings as [string, string])} />
          <Button type="primary" onClick={handleFilter}>查询</Button>
          <Button>重置</Button>
        </Space>
        
        <Table
          columns={columns}
          dataSource={branches}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Branches; 