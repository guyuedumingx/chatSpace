import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Upload, 
  message, 
  Table, 
  Space, 
  Modal, 
  Input, 
  Form, 
  Tag, 
  Tooltip,
  Typography,
  Spin
} from 'antd';
import { 
  UploadOutlined, 
  SearchOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion, importQuestions } from '../api/questionbank';
import type { QuestionData } from '../api/questionbank';

const { Title } = Typography;

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 获取数据
  const fetchQuestions = async (params = {}) => {
    setLoading(true);
    try {
      const response = await getQuestions({
        page: pagination.current,
        pageSize: pagination.pageSize,
        searchText: searchText,
        ...params,
      });
      setQuestions(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total,
      }));
    } catch (error) {
      messageApi.error('获取问题列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchQuestions();
  }, []);

  // 表格列定义
  const columns: ColumnsType<QuestionData> = [
    {
      title: '导入日期',
      dataIndex: 'importDate',
      key: 'importDate',
      sorter: (a, b) => dayjs(a.importDate).unix() - dayjs(b.importDate).unix(),
    },
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 80,
    },
    {
      title: '入口交易码',
      dataIndex: 'entryCode',
      key: 'entryCode',
    },
    {
      title: '联机交易码',
      dataIndex: 'onlineCode',
      key: 'onlineCode',
    },
    {
      title: '问题种类',
      dataIndex: 'questionType',
      key: 'questionType',
      filters: Array.from(new Set(questions.map(q => q.questionType))).map(type => ({
        text: type,
        value: type,
      })),
      onFilter: (value, record) => record.questionType === value,
    },
    {
      title: '问题描述',
      dataIndex: 'questionDescription',
      key: 'questionDescription',
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '操作指引',
      dataIndex: 'operationGuide',
      key: 'operationGuide',
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '关键词',
      key: 'keywords',
      dataIndex: 'keywords',
      render: (_, { keywords }) => (
        <>
          {keywords.map(keyword => (
            <Tag color="blue" key={keyword}>
              {keyword}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => handleEdit(record)}><EditOutlined /> 编辑</a>
          <a onClick={() => handleDelete(record.id)}><DeleteOutlined /> 删除</a>
        </Space>
      ),
    },
  ];

  // 处理文件上传
  const handleUpload: UploadProps['onChange'] = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      try {
        await importQuestions(info.file.originFileObj as File);
        messageApi.success(`${info.file.name} 文件上传成功`);
        fetchQuestions();
      } catch (error) {
        messageApi.error('文件上传失败');
      } finally {
        setLoading(false);
      }
    }
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchQuestions();
  };

  // 处理编辑
  const handleEdit = (record: QuestionData) => {
    setCurrentQuestion(record);
    form.setFieldsValue({
      ...record,
      keywords: record.keywords.join(',')
    });
    setIsModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条问题记录吗？',
      onOk: async () => {
        try {
          await deleteQuestion(id);
          messageApi.success('删除成功');
          fetchQuestions();
        } catch (error) {
          messageApi.error('删除失败');
        }
      }
    });
  };

  // 处理表单提交
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const questionData = {
        ...values,
        keywords: values.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k),
      };
      
      if (currentQuestion) {
        await updateQuestion(currentQuestion.id, questionData);
      } else {
        await createQuestion(questionData);
      }
      
      messageApi.success(currentQuestion ? '更新成功' : '创建成功');
      setIsModalVisible(false);
      fetchQuestions();
    } catch (error) {
      messageApi.error(currentQuestion ? '更新失败' : '创建失败');
    }
  };

  // 上传组件配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/admin/questionbank/questions/import',
    accept: '.xlsx,.xls',
    showUploadList: false,
    onChange: handleUpload,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        await importQuestions(file as File);
        onSuccess?.({} as any);
      } catch (error) {
        onError?.(error as any);
      }
    }
  };

  return (
    <div>
      {contextHolder}
      <Title level={2}>问题库管理</Title>
      
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} type="primary">
              导入问题库
            </Button>
          </Upload>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setCurrentQuestion(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            新增问题
          </Button>
          
          <Input
            placeholder="搜索问题/关键词"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            onPressEnter={handleSearch}
          />
          
          <Button onClick={handleSearch}>搜索</Button>
          <Button onClick={() => {
            setSearchText('');
            fetchQuestions();
          }}>重置</Button>
          
          <Tooltip title="支持导入Excel格式的问题库文件，表头需包含：入口交易码、联机交易码、问题种类、问题描述、操作指引、备注、关键词">
            <Button icon={<QuestionCircleOutlined />}>导入说明</Button>
          </Tooltip>
        </Space>
        
        <Spin spinning={loading}>
          <Table 
            columns={columns} 
            dataSource={questions}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize }));
                fetchQuestions();
              }
            }}
          />
        </Spin>
      </Card>
      
      <Modal
        title={currentQuestion ? "编辑问题" : "新增问题"}
        open={isModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={currentQuestion ? {
            ...currentQuestion,
            keywords: currentQuestion.keywords.join(',')
          } : {
            importDate: dayjs().format('YYYY-MM-DD')
          }}
        >
          <Form.Item name="importDate" label="修改日期" rules={[{ required: true }]}>
            <Input disabled={!!currentQuestion} />
          </Form.Item>
          
          <Form.Item name="entryCode" label="入口交易码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="onlineCode" label="联机交易码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="questionType" label="问题种类" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="questionDescription" label="问题描述" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Form.Item name="operationGuide" label="操作指引" rules={[{ required: true }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          
          <Form.Item name="remark" label="备注">
            <Input />
          </Form.Item>
          
          <Form.Item name="keywords" label="关键词" rules={[{ required: true }]} extra="多个关键词请用逗号分隔">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestionBank; 