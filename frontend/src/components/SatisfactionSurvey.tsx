import React from 'react';
import { Modal, Radio, Input, message } from 'antd';
import { ContactInfo } from '@/api/chat';

interface SatisfactionSurveyProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    solved: 'yes' | 'no';
    comment?: string;
  }) => void;
  contactInfo: ContactInfo[];
}

const SatisfactionSurvey: React.FC<SatisfactionSurveyProps> = ({ visible, onClose, onSubmit, contactInfo }) => {
  const [solved, setSolved] = React.useState<'yes' | 'no' | undefined>();
  const [comment, setComment] = React.useState('');
  const [messageApi, contextHolder] = message.useMessage();

  const handleOk = () => {
    if (!solved) {
      messageApi.warning('请选择“是否解决您的问题”');
      return;
    }
    onSubmit({
      solved,
      comment: comment.trim() ? comment : undefined,
    });
    onClose();
    setSolved(undefined);
    setComment('');
  };

  return (
    <Modal
      open={visible}
      title="对本次对话的满意度调查"
      onCancel={onClose}
      onOk={handleOk}
      okText="提交"
      cancelText="取消"
      destroyOnClose
    >
      {contextHolder}
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>本次咨询是否已解决您的问题？</div>
        <Radio.Group
          onChange={e => setSolved(e.target.value)}
          value={solved}
        >
          <Radio value="yes">是</Radio>
          <Radio value="no">否</Radio>
        </Radio.Group>
      </div>
      {solved === 'no' && (
        <div style={{ marginBottom: 16, color: '#faad14' }}>
          <div style={{ marginBottom: 8 }}>如需进一步帮助，请联系：</div>
          {contactInfo.sort((a, b) => a.order - b.order).map((contact, index) => (
            <div key={index}>联系人：{contact.contactName}　电话：{contact.contactPhone}</div>
          ))}
        </div>
      )}
      <div>
        <div style={{ marginBottom: 8 }}>如有相关意见及建议，请填写：</div>
        <Input.TextArea
          placeholder="请填写您的建议或意见"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  );
};

export default SatisfactionSurvey;
