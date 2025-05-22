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
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 使用 useEffect 实现防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500); // 500ms 防抖延迟

    return () => clearTimeout(timer);
  }, [searchText]);

  // 监听防抖后的搜索文本变化
  useEffect(() => {
    if (debouncedSearchText !== undefined) {
      handleSearch();
    }
  }, [debouncedSearchText]);

  // 获取数据
  const fetchQuestions = async (params = {}) => {
    setLoading(true);
    try {
      const pageParams = {
        page: params.page || pagination.current,
        pageSize: params.pageSize || pagination.pageSize,
        ...params,
      };

      console.log('请求参数:', pageParams);
      const response = await getQuestions(pageParams);
      
      setQuestions(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        current: pageParams.page,
        pageSize: pageParams.pageSize,
      }));
    } catch (error) {
      console.error('获取数据失败:', error);
      messageApi.error('获取问题列表失败');
      setQuestions([]);
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
      key: 'index',
      width: 80,
      render: (_, __, index) => {
        // 计算序号：(当前页码 - 1) * 每页条数 + 当前行索引 + 1
        const currentIndex = (pagination.current - 1) * pagination.pageSize + index + 1;
        return currentIndex;
      },
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
      filters: questions?.length > 0 ? Array.from(new Set(questions.map(q => q.questionType))).map(type => ({
        text: type,
        value: type,
      })) : [],
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
          {keywords?.map(keyword => (
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
          <Tooltip title="编辑">
            <a onClick={() => handleEdit(record)}><EditOutlined /></a>  
          </Tooltip>
          <Tooltip title="删除">
            <a onClick={() => handleDelete(record.id)}><DeleteOutlined /></a>
          </Tooltip>
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
    // 重置到第一页
    setPagination(prev => ({ ...prev, current: 1 }));
    // 调用获取数据函数，传入搜索文本
    console.log(searchText);
    fetchQuestions({ searchText });
  };

  // 处理重置
  const handleReset = () => {
    // 清空搜索文本
    setSearchText('');
    // 重置到第一页
    setPagination(prev => ({ ...prev, current: 1 }));
    // 重新获取数据
    fetchQuestions({ searchText: '' });
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
    accept: '.xlsx,.xls',
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        await importQuestions(file as File);
        onSuccess?.({} as any);
        messageApi.success(`${file.name} 文件上传成功`);
        fetchQuestions();
      } catch (error) {
        onError?.(error as any);
        messageApi.error('文件上传失败');
      }
    }
  };

  return (
    <div>
      {contextHolder}
      <h2>问题库管理</h2>
      
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
            allowClear
          />
          
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          
          <Button onClick={handleReset}>
            重置
          </Button>
          
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
              showQuickJumper: true,
              onChange: (page, pageSize) => {
                console.log('分页变化:', { page, pageSize });
                fetchQuestions({ page, pageSize });
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