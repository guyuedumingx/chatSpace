import React, { useState, useEffect } from 'react';
import { Table, Card, DatePicker, Button, Space, Row, Col, Statistic, Spin, Alert, Empty, Input, Modal } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { getBranchesData, resetPassword } from '../api';
import type { PaginationParams } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import type { TablePaginationConfig } from 'antd/es/table';
import { message } from 'antd';

const { RangePicker } = DatePicker;

// 组织数据接口
interface OrgData {
  id: string;
  orgCode: string;
  orgName: string;
  createdAt: string;
  updatedAt: string;
  isFirstLogin: boolean;
  passwordLastChanged: string;
}

interface OrgDataUI extends OrgData {
  key: string;
}

const Organization: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<OrgDataUI[]>([]);
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [messageApi, messageContextHolder] = message.useMessage();

  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');
  const [orgCode, setOrgCode] = useState<string>('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (id) {
      setKeyword(id);
    }
    
    fetchOrgsData();
  }, [location]);

  const fetchOrgsData = async (pageNum = page, pageSizeNum = pageSize) => {
    try {
      setLoading(true);
      const params: Partial<PaginationParams> = {
        page: pageNum,
        pageSize: pageSizeNum
      };

      if (keyword) {
        params.keyword = keyword;
      }

      // 使用后端API接口
      const response = await getBranchesData(params);
      
      if (response.data) {
        // 转换数据为UI所需格式
        const orgsData = response.data.map((org: OrgData) => ({
          ...org,
          key: org.orgCode,
        }));
        
        setOrgs(orgsData);
        setTotalOrgs(response.data.length);
        setPage(pageNum);
        setPageSize(pageSizeNum);
      }
      
      setError(null);
    } catch (err) {
      console.error('获取网点数据失败:', err);
      setError('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '机构编号',
      dataIndex: 'orgCode',
      key: 'orgCode',
    },
    {
      title: '机构名称',
      dataIndex: 'orgName',
      key: 'orgName',
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      key: 'contactName',
    },
    {
      title: '联系人EHR',
      dataIndex: 'contactEhr',
      key: 'contactEhr',
    },
    {
      title: '联系人电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
    },
    {
      title: '最后密码修改时间',
      dataIndex: 'passwordLastChanged',
      key: 'passwordLastChanged',
      render: (text: string) => text ? new Date(text).toLocaleString() : '未修改',
    },
    {
      title: '状态',
      dataIndex: 'isFirstLogin',
      key: 'isFirstLogin',
      render: (isFirstLogin: boolean) => isFirstLogin ? '未激活' : '已激活',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: OrgDataUI) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleResetPassword(record.orgCode)}>重置密码</Button>
        </Space>
      ),
    },
  ];

  // 处理筛选
  const handleFilter = () => {
    fetchOrgsData(1, pageSize);
  };

  const handleResetPassword = (orgCode: string) => {
    setResetPasswordModalOpen(true);
    setOrgCode(orgCode);
  };

  const handleResetPasswordOk = async () => {
    if (password !== passwordConfirm) {
      messageApi.error('两次输入的密码不一致');
      return;
    }
    setResetPasswordModalOpen(false);
    const response = await resetPassword(orgCode, password);
    if (response.data) {
      messageApi.success('密码重置成功');
    } else {
      messageApi.error('密码重置失败');
    }
  };

  const handleResetPasswordCancel = () => {
    setResetPasswordModalOpen(false);
  }

  // 重置筛选
  const handleReset = () => {
    setKeyword('');
    setDateRange(null);
    navigate('/organization');
    fetchOrgsData(1, pageSize);
  };

  // 处理分页变化
  const handleTableChange = (
    pagination: TablePaginationConfig
  ) => {
    if (pagination.current && pagination.pageSize) {
      fetchOrgsData(pagination.current, pagination.pageSize);
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
      {messageContextHolder}
      <h2>机构管理</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="总网点数"
              value={totalOrgs}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="重置密码"
        open={resetPasswordModalOpen}
        onOk={handleResetPasswordOk}
        onCancel={handleResetPasswordCancel}
      >
        <p>确定要重置密码吗？</p>

        <Input placeholder="请输入新密码" value={password} style={{marginBottom: '5px'}} onChange={e => setPassword(e.target.value)} />
        <Input placeholder="请确认新密码" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
      </Modal>

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input 
            placeholder="搜索网点名称或编号"
            style={{ width: 200 }}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <Button type="primary" onClick={handleFilter}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
        
        <Spin spinning={loading}>
          {orgs.length > 0 ? (
            <Table
              columns={columns}
              dataSource={orgs}
              rowKey="key"
              pagination={{
                current: page,
                pageSize: pageSize,
                total: totalOrgs,
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

export default Organization; 