import React, { useState, useEffect } from 'react';
import { Table, Card, Select, DatePicker, Button, Space, Tag, Input, Spin, Alert, Empty } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { Dayjs } from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
import type { TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import type { Survey, PaginationParams } from '../types';
import { getSurveysData, getSurveyDetail } from '../api';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface SurveyUI extends Survey {
  key: string;
}

const Surveys: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surveys, setSurveys] = useState<SurveyUI[]>([]);
  const [total, setTotal] = useState(0);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [solvedFilter, setSolvedFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orgCode = params.get('orgCode');
    const conversationId = params.get('conversationId');
    
    if (orgCode) {
      setBranchFilter(orgCode);
    }
    
    if (conversationId) {
      setSearchTerm(conversationId);
    }
    
    fetchSurveysData();
  }, [location]);

  const fetchSurveysData = async (pageNum = page, pageSizeNum = pageSize) => {
    try {
      setLoading(true);
      const params: Partial<PaginationParams> = {
        page: pageNum,
        pageSize: pageSizeNum
      };

      if (searchTerm) {
        params.keyword = searchTerm;
      }

      if (branchFilter) {
        params.orgCode = branchFilter;
      }

      if (solvedFilter) {
        params.solved = solvedFilter;
      }

      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await getSurveysData(params);
      
      if (response.data) {
        const surveysData = response.data.data.map((survey: Survey) => ({
          ...survey,
          key: survey.id,
        }));
        
        setSurveys(surveysData);
        setTotal(response.data.total);
        setPage(response.data.page);
        setPageSize(response.data.pageSize);
      }
      
      setError(null);
    } catch (err) {
      console.error('获取满意度调查数据失败:', err);
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
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      sorter: (a: SurveyUI, b: SurveyUI) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: '所属机构',
      dataIndex: 'orgName',
      key: 'orgName',
      render: (text: string, record: SurveyUI) => (
        <a onClick={() => navigate(`/branches?id=${record.orgCode}`)}>{text}</a>
      )
    },
    {
      title: '问题是否解决',
      dataIndex: 'solved',
      key: 'solved',
      render: (solved: 'yes' | 'no') => (
        <Tag color={solved === 'yes' ? 'success' : 'error'}>
          {solved === 'yes' ? '已解决' : '未解决'}
        </Tag>
      ),
      filters: [
        { text: '已解决', value: 'yes' },
        { text: '未解决', value: 'no' },
      ],
    },
    {
      title: '用户评价',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
      render: (comment: string | undefined) => comment || '无评价',
    },
    {
      title: '用户信息',
      key: 'user',
      render: (text: string, record: SurveyUI) => (
        <span>
          {record.userName || '匿名用户'}
          {record.userPhone ? ` (${record.userPhone})` : ''}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: SurveyUI) => (
        <Space size="middle">
          <a onClick={() => navigate(`/surveys/${record.id}`)}>详情</a>
          <a onClick={() => navigate(`/conversations/${record.conversationId}`)}>查看对话</a>
        </Space>
      ),
    },
  ];

  // 处理筛选
  const handleFilter = () => {
    fetchSurveysData(1, pageSize);
  };

  // 重置筛选
  const handleReset = () => {
    setBranchFilter(null);
    setSolvedFilter(null);
    setDateRange(null);
    setSearchTerm('');
    navigate('/surveys');
    fetchSurveysData(1, pageSize);
  };

  // 处理分页变化
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<SurveyUI> | SorterResult<SurveyUI>[]
  ) => {
    // 处理筛选
    if (filters.solved && filters.solved.length) {
      setSolvedFilter(filters.solved[0] as string);
    } else {
      setSolvedFilter(null);
    }

    // 处理分页
    if (pagination.current && pagination.pageSize) {
      fetchSurveysData(pagination.current, pagination.pageSize);
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
      <h2>满意度调查</h2>
      
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索关键词"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="所属机构"
            style={{ width: 150 }}
            allowClear
            value={branchFilter || undefined}
            onChange={value => setBranchFilter(value)}
          >
            {Array.from(new Set(surveys.map(item => item.orgCode))).map(orgCode => {
              const org = surveys.find(item => item.orgCode === orgCode);
              return <Option key={orgCode} value={orgCode}>{org?.orgName || orgCode}</Option>;
            })}
          </Select>
          <Select
            placeholder="问题解决情况"
            style={{ width: 150 }}
            allowClear
            value={solvedFilter || undefined}
            onChange={value => setSolvedFilter(value)}
          >
            <Option value="yes">已解决</Option>
            <Option value="no">未解决</Option>
          </Select>
          <RangePicker 
            disabledDate={disabledDate} 
            value={dateRange}
            onChange={dates => setDateRange(dates as [Dayjs, Dayjs])}
          />
          <Button type="primary" onClick={handleFilter}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
        
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> 已解决问题数: 
              {surveys.filter(item => item.solved === 'yes').length}
            </span>
            <span>
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 未解决问题数: 
              {surveys.filter(item => item.solved === 'no').length}
            </span>
            <span>
              解决率: 
              {surveys.length ? 
                ((surveys.filter(item => item.solved === 'yes').length / surveys.length) * 100).toFixed(1) + '%' 
                : '0%'}
            </span>
          </Space>
        </div>
        
        <Spin spinning={loading}>
          {surveys.length > 0 ? (
            <Table
              columns={columns}
              dataSource={surveys}
              onChange={handleTableChange}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          ) : (
            <Empty description="暂无数据" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default Surveys; 