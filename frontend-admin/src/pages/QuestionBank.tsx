import React, { useState } from 'react';
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
  FileExcelOutlined, 
  SearchOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// 问题库数据接口
interface QuestionData {
  key: string;
  importDate: string;
  index: number;
  entryCode: string;
  onlineCode: string;
  questionType: string;
  questionDescription: string;
  operationGuide: string;
  remark: string;
  keywords: string[];
}

// 模拟问题库数据
const mockQuestionData: QuestionData[] = [
  {
    key: '1',
    importDate: '2023-11-20',
    index: 1,
    entryCode: 'TX001',
    onlineCode: 'OL001',
    questionType: '账户管理',
    questionDescription: '如何开立企业账户？',
    operationGuide: '1. 准备营业执照等材料；2. 前往网点办理；3. 填写开户申请表；4. 等待审核通过',
    remark: '需要提前预约',
    keywords: ['企业账户', '开户', '对公账户']
  },
  {
    key: '2',
    importDate: '2023-11-20',
    index: 2,
    entryCode: 'TX002',
    onlineCode: 'OL002',
    questionType: '转账汇款',
    questionDescription: '企业网银转账限额是多少？',
    operationGuide: '企业网银转账限额根据您的企业类型和安全认证方式有所不同，一般情况下：1. U盾认证：单笔最高500万，每日最高1000万；2. 动态密码：单笔最高50万，每日最高100万',
    remark: '可申请调整限额',
    keywords: ['企业网银', '转账限额', '对公转账']
  },
  {
    key: '3',
    importDate: '2023-11-21',
    index: 3,
    entryCode: 'TX003',
    onlineCode: 'OL003',
    questionType: '网银操作',
    questionDescription: '企业网银如何添加收款人？',
    operationGuide: '1. 登录企业网银；2. 进入"收款人管理"；3. 点击"新增收款人"；4. 填写收款人信息；5. 使用U盾或动态密码确认',
    remark: '',
    keywords: ['企业网银', '收款人', '添加收款人']
  }
];

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionData[]>(mockQuestionData);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

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
      filters: Array.from(new Set(mockQuestionData.map(q => q.questionType))).map(type => ({
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
          <a onClick={() => handleDelete(record.key)}><DeleteOutlined /> 删除</a>
        </Space>
      ),
    },
  ];

  // 处理文件上传
  const handleUpload: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      setLoading(false);
      messageApi.success(`${info.file.name} 文件上传成功`);
      
      // TODO: 后端接口对接
      // 接口路径: /api/v1/admin/questions/import
      // 请求方法: POST
      // 请求参数: FormData 包含 Excel 文件
      // 返回格式: { success: boolean, data: QuestionData[], message: string }
      
      // 模拟导入成功，添加新数据
      const newQuestions = [
        ...questions,
        {
          key: (questions.length + 1).toString(),
          importDate: dayjs().format('YYYY-MM-DD'),
          index: questions.length + 1,
          entryCode: `TX${(questions.length + 1).toString().padStart(3, '0')}`,
          onlineCode: `OL${(questions.length + 1).toString().padStart(3, '0')}`,
          questionType: '新导入问题',
          questionDescription: `从${info.file.name}导入的问题`,
          operationGuide: '导入的操作指引',
          remark: '自动导入',
          keywords: ['导入', '自动']
        }
      ];
      setQuestions(newQuestions);
    } else if (info.file.status === 'error') {
      setLoading(false);
      messageApi.error(`${info.file.name} 文件上传失败`);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    if (!searchText) {
      setQuestions(mockQuestionData);
      return;
    }
    
    const filtered = mockQuestionData.filter(q => 
      q.questionDescription.toLowerCase().includes(searchText.toLowerCase()) ||
      q.keywords.some(k => k.toLowerCase().includes(searchText.toLowerCase())) ||
      q.questionType.toLowerCase().includes(searchText.toLowerCase()) ||
      q.entryCode.toLowerCase().includes(searchText.toLowerCase()) ||
      q.onlineCode.toLowerCase().includes(searchText.toLowerCase())
    );
    
    setQuestions(filtered);
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
  const handleDelete = (key: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条问题记录吗？',
      onOk: () => {
        // TODO: 后端接口对接
        // 接口路径: /api/v1/admin/questions/{id}
        // 请求方法: DELETE
        // 返回格式: { success: boolean, message: string }
        
        setQuestions(questions.filter(q => q.key !== key));
        messageApi.success('删除成功');
      }
    });
  };

  // 处理表单提交
  const handleFormSubmit = () => {
    form.validateFields().then(values => {
      // TODO: 后端接口对接
      // 接口路径: /api/v1/admin/questions/{id}
      // 请求方法: PUT
      // 请求参数: values
      // 返回格式: { success: boolean, data: QuestionData, message: string }
      
      const updatedQuestion = {
        ...currentQuestion!,
        ...values,
        keywords: values.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k),
      };
      
      setQuestions(questions.map(q => q.key === currentQuestion!.key ? updatedQuestion : q));
      setIsModalVisible(false);
      messageApi.success('更新成功');
    });
  };

  // 上传组件配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/v1/admin/questions/import', // 实际上传地址
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    accept: '.xlsx,.xls',
    showUploadList: false,
    onChange: handleUpload,
    customRequest: ({ onSuccess }) => {
      // 模拟上传过程
      setTimeout(() => {
        onSuccess?.({} as any);
      }, 2000);
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
            setQuestions(mockQuestionData);
          }}>重置</Button>
          
          <Tooltip title="支持导入Excel格式的问题库文件，表头需包含：序号、入口交易码、联机交易码、问题种类、问题描述、操作指引、备注、关键词">
            <Button icon={<QuestionCircleOutlined />}>导入说明</Button>
          </Tooltip>
        </Space>
        
        <Spin spinning={loading}>
          <Table 
            columns={columns} 
            dataSource={questions}
            rowKey="key"
            pagination={{ pageSize: 10 }}
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
            importDate: dayjs().format('YYYY-MM-DD'),
            index: questions.length + 1
          }}
        >
          <Form.Item name="importDate" label="修改日期" rules={[{ required: true }]}>
            <Input disabled={!!currentQuestion} />
          </Form.Item>
          
          <Form.Item name="index" label="序号" rules={[{ required: true }]}>
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