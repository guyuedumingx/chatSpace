import React, { useState, useEffect } from 'react';
import { Table, Card, Select, DatePicker, Button, Space, Row, Col, Statistic, Tooltip, Spin, Alert, Empty } from 'antd';
import { ShopOutlined, CommentOutlined, TeamOutlined, StarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';
import { getBranchesData } from '../api';
import type { Branch, PaginationParams } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';

const { RangePicker } = DatePicker;

interface BranchDataUI extends Branch {
  key: string;
}

const Branches: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<BranchDataUI[]>([]);
  const [totalBranches, setTotalBranches] = useState(0);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (id) {
      setKeyword(id);
    }
    
    fetchBranchesData();
  }, [location]);

  const fetchBranchesData = async (pageNum = page, pageSizeNum = pageSize) => {
    try {
      setLoading(true);
      const params: Partial<PaginationParams> = {
        page: pageNum,
        pageSize: pageSizeNum
      };

      if (keyword) {
        params.keyword = keyword;
      }

      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await getBranchesData(params);
      
      if (response.data) {
        // 转换数据为UI所需格式
        const branchesData = response.data.data.map((branch: Branch) => ({
          ...branch,
          key: branch.orgCode,
        }));
        
        setBranches(branchesData);
        setTotalBranches(response.data.total);
        setPage(response.data.page);
        setPageSize(response.data.pageSize);
      }
      
      setError(null);
    } catch (err) {
      console.error('获取网点数据失败:', err);
      setError('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 日期范围选择器配置
  const disabledDate: RangePickerProps['disabledDate'] = (current: Dayjs | null) => {
    return current ? current.valueOf() > Date.now() : false;
  };

  // 表格列定义
  const columns = [
    {
      title: '网点名称',
      dataIndex: 'orgName',
      key: 'orgName',
    },
    {
      title: '对话次数',
      dataIndex: 'conversationCount',
      key: 'conversationCount',
      sorter: (a: BranchDataUI, b: BranchDataUI) => a.conversationCount - b.conversationCount,
    },
    {
      title: '活跃用户数',
      dataIndex: 'dailyActiveUsers',
      key: 'dailyActiveUsers',
      sorter: (a: BranchDataUI, b: BranchDataUI) => a.dailyActiveUsers - b.dailyActiveUsers,
    },
    {
      title: '平均满意度',
      dataIndex: 'avgSatisfactionRate',
      key: 'avgSatisfactionRate',
      sorter: (a: BranchDataUI, b: BranchDataUI) => a.avgSatisfactionRate - b.avgSatisfactionRate,
      render: (rate: number) => {
        const rateValue = rate * 5; // 转换为5分制
        const stars = '★'.repeat(Math.floor(rateValue)) + 
                     (rateValue % 1 >= 0.5 ? '★' : '☆').repeat(1) + 
                     '☆'.repeat(4 - Math.floor(rateValue));
        return <span style={{ color: '#faad14' }}>{stars} ({(rate * 100).toFixed(1)}%)</span>;
      },
    },
    {
      title: (
        <span>
          问题解决率 
          <Tooltip title="用户通过满意度调查反馈问题是否解决的百分比">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'solvedRate',
      key: 'solvedRate',
      sorter: (a: BranchDataUI, b: BranchDataUI) => a.solvedRate - b.solvedRate,
      render: (rate: number) => {
        let color = '#52c41a'; // 默认绿色
        const percentRate = rate * 100;
        if (percentRate < 85) color = '#faad14'; // 低于85%黄色
        if (percentRate < 75) color = '#ff4d4f'; // 低于75%红色
        
        return <span style={{ color }}>{percentRate.toFixed(1)}%</span>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: BranchDataUI) => (
        <Space size="middle">
          <a onClick={() => navigate(`/branches/${record.orgCode}`)}>详情</a>
          <a onClick={() => navigate(`/conversations?orgCode=${record.orgCode}`)}>查看对话</a>
          <a onClick={() => navigate(`/admin/export/branch/${record.orgCode}`)}>导出报告</a>
        </Space>
      ),
    },
  ];

  // 处理筛选
  const handleFilter = () => {
    fetchBranchesData(1, pageSize);
  };

  // 重置筛选
  const handleReset = () => {
    setKeyword('');
    setDateRange(null);
    navigate('/branches');
    fetchBranchesData(1, pageSize);
  };

  // 处理分页变化
  const handleTableChange = (
    pagination: TablePaginationConfig, 
    _filters: Record<string, FilterValue | null>,
    _sorter: SorterResult<BranchDataUI> | SorterResult<BranchDataUI>[]
  ) => {
    if (pagination.current && pagination.pageSize) {
      fetchBranchesData(pagination.current, pagination.pageSize);
    }
  };

  if (error) {
    return (
      <Alert
        message="错误"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  return (
    <div>
      <h2>网点统计</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="总网点数"
              value={totalBranches}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="总对话次数"
              value={branches.reduce((sum, branch) => sum + branch.conversationCount, 0)}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="活跃用户数"
              value={branches.reduce((sum, branch) => sum + branch.dailyActiveUsers, 0)}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="平均满意度"
              value={branches.length ? (branches.reduce((sum, branch) => sum + branch.avgSatisfactionRate, 0) / branches.length * 100).toFixed(1) : 0}
              prefix={<StarOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>
      
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="搜索网点"
            style={{ width: 200 }}
            allowClear
            showSearch
            value={keyword || undefined}
            onChange={value => setKeyword(value)}
            options={branches.map(branch => ({ value: branch.orgCode, label: branch.orgName }))}
          />
          <RangePicker 
            disabledDate={disabledDate} 
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs])} 
          />
          <Button type="primary" onClick={handleFilter}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
        
        <Spin spinning={loading}>
          {branches.length > 0 ? (
            <Table
              columns={columns}
              dataSource={branches}
              rowKey="key"
              pagination={{
                current: page,
                pageSize: pageSize,
                total: totalBranches,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              onChange={handleTableChange}
            />
          ) : (
            <Empty description="暂无数据" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default Branches; 