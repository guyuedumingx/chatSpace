import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Divider, Table, Spin, Alert } from 'antd';
import { 
  CommentOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined
} from '@ant-design/icons';
import { getDashboardData } from '../api';
import type { DashboardData } from '../types';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface TopBranch {
  orgCode: string;
  orgName: string;
  count: number;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardData();
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('获取仪表盘数据失败:', err);
      setError('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 生成折线图配置
  const getLineChartOption = (): EChartsOption => {
    if (!data || !data.conversationTrend) return {};

    const dates = data.conversationTrend.map(item => item.date);
    const counts = data.conversationTrend.map(item => item.count);

    return {
      tooltip: {
        trigger: 'axis' as const
      },
      xAxis: {
        type: 'category' as const,
        data: dates
      },
      yAxis: {
        type: 'value' as const
      },
      series: [
        {
          name: '对话数量',
          data: counts,
          type: 'line' as const,
          smooth: true,
          lineStyle: {
            color: '#9A1F24'
          },
          itemStyle: {
            color: '#9A1F24'
          }
        }
      ]
    };
  };

  // 表格列定义
  const columns = [
    {
      title: '分支机构',
      dataIndex: 'orgName',
      key: 'orgName',
    },
    {
      title: '对话数量',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: TopBranch) => (
        <a href={`/branches/${record.orgCode}`}>详情</a>
      ),
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="错误"
        description={error}
        type="error"
        showIcon
        style={{ margin: '50px 0' }}
      />
    );
  }

  return (
    <div>
      <h2>数据总览</h2>
      <Divider />
      
      {data && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false}>
                <Statistic
                  title="对话总数"
                  value={data.totalConversations}
                  prefix={<CommentOutlined />}
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
                  value={(data.avgSatisfactionRate * 100).toFixed(1)}
                  prefix={<CheckCircleOutlined />}
                  suffix="%"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false}>
                <Statistic
                  title="问题解决率"
                  value={(data.solvedRate * 100).toFixed(1)}
                  prefix={<CloseCircleOutlined />}
                  suffix="%"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={15}>
              <Card title="近7天对话趋势">
                <ReactECharts option={getLineChartOption()} style={{ height: 300 }} />
              </Card>
            </Col>
            <Col xs={24} lg={9}>
              <Card 
                title="机构排名" 
                extra={<a href="/branches">查看全部</a>}
              >
                <Table 
                  columns={columns} 
                  dataSource={data.topBranches} 
                  rowKey="orgCode"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard; 