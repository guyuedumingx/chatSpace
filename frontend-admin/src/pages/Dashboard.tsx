import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Divider, Table, Tag } from 'antd';
import { 
  CommentOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';

// 模拟数据
const mockData = {
  totalConversations: 1358,
  todayConversations: 87,
  satisfactionRate: 92.5,
  avgResponseTime: '1分42秒',
  conversationGrowth: 12.3,
  satisfactionGrowth: -2.1,
  recentConversations: [
    { 
      id: '1', 
      branch: '总行营业部', 
      time: '2023-11-16 09:23:45', 
      topic: '企业开户咨询', 
      status: 'solved',
      satisfaction: 5
    },
    { 
      id: '2', 
      branch: '金融中心支行', 
      time: '2023-11-16 10:12:33', 
      topic: '对公转账限额', 
      status: 'solved',
      satisfaction: 4
    },
    { 
      id: '3', 
      branch: '城东支行', 
      time: '2023-11-16 10:45:21', 
      topic: '网银开通流程', 
      status: 'unsolved',
      satisfaction: 3
    },
    { 
      id: '4', 
      branch: '沿江支行', 
      time: '2023-11-16 11:03:40', 
      topic: '理财产品咨询', 
      status: 'solved',
      satisfaction: 5
    },
    { 
      id: '5', 
      branch: '城西支行', 
      time: '2023-11-16 11:05:55', 
      topic: '密码重置问题', 
      status: 'solved',
      satisfaction: 4
    },
  ]
};

const Dashboard: React.FC = () => {
  const [data] = useState(mockData);

  useEffect(() => {
    // 这里可以从API获取真实数据
    // 暂时使用模拟数据
  }, []);

  const columns = [
    {
      title: '分支机构',
      dataIndex: 'branch',
      key: 'branch',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '咨询主题',
      dataIndex: 'topic',
      key: 'topic',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'solved' ? 'success' : 'error'}>
          {status === 'solved' ? '已解决' : '未解决'}
        </Tag>
      ),
    },
    {
      title: '满意度',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      render: (satisfaction: number) => {
        const stars = '★'.repeat(satisfaction) + '☆'.repeat(5 - satisfaction);
        return <span style={{ color: '#faad14' }}>{stars}</span>;
      },
    },
  ];

  return (
    <div>
      <h2>数据总览</h2>
      <Divider />
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="对话总数"
              value={data.totalConversations}
              prefix={<CommentOutlined />}
              suffix={
                <span style={{ fontSize: 14, marginLeft: 8 }}>
                  <ArrowUpOutlined style={{ color: '#52c41a' }} /> {data.conversationGrowth}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="今日对话"
              value={data.todayConversations}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="平均满意度"
              value={data.satisfactionRate}
              prefix={<CheckCircleOutlined />}
              suffix="%"
              valueStyle={{ color: data.satisfactionGrowth >= 0 ? '#3f8600' : '#cf1322' }}
            />
            <span style={{ fontSize: 14 }}>
              {data.satisfactionGrowth >= 0 ? (
                <ArrowUpOutlined style={{ color: '#52c41a' }} />
              ) : (
                <ArrowDownOutlined style={{ color: '#cf1322' }} />
              )}
              {' '}
              {Math.abs(data.satisfactionGrowth)}%
            </span>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="平均响应时间"
              value={data.avgResponseTime}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="最近对话" 
        style={{ marginTop: 16 }}
        extra={<a href="/conversations">查看更多</a>}
      >
        <Table 
          columns={columns} 
          dataSource={data.recentConversations} 
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default Dashboard; 