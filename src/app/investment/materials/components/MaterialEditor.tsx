'use client';
import { Collapse, DatePicker, Form, Input, Modal, Select, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import type { ResearchMaterial, ResearchMaterialInput } from '@/types/life-os';

const typeOptions = [
  { value: 'fact', label: '事实' }, { value: 'news', label: '新闻' },
  { value: 'viewpoint', label: '观点' }, { value: 'report_excerpt', label: '财报摘录' },
];

export default function MaterialEditor({ open, initial, saving, onCancel, onSubmit }: {
  open: boolean; initial: ResearchMaterial | null; saving: boolean; onCancel: () => void;
  onSubmit: (input: ResearchMaterialInput, files: File[]) => void | Promise<void>;
}) {
  const [form] = Form.useForm();
  const submit = async () => {
    const values = await form.validateFields();
    const files = ((values.images as UploadFile[] | undefined)?.map((item) => item.originFileObj).filter(Boolean) ?? []) as File[];
    await onSubmit({ ...values, source_date: values.source_date?.format('YYYY-MM-DD') ?? null, image_paths: initial?.image_paths ?? [] }, files);
  };
  return <Modal title={initial ? '编辑资料' : '新增资料'} open={open} confirmLoading={saving} okText="保存资料" cancelText="取消" onCancel={onCancel} onOk={submit} afterOpenChange={(visible) => {
    if (!visible) return;
    form.resetFields();
    form.setFieldsValue(initial ? { ...initial, source_date: initial.source_date ? dayjs(initial.source_date) : undefined, images: [] } : { material_type: 'fact', images: [] });
  }}>
    <Form form={form} layout="vertical">
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '请填写标题' }]}><Input placeholder="这条资料主要讲什么" /></Form.Item>
      <Form.Item name="content" label="内容或关键摘录" rules={[{ required: true, message: '请填写内容或关键摘录' }]}><Input.TextArea rows={6} placeholder="粘贴值得保留的内容" /></Form.Item>
      <Form.Item name="material_type" label="类型" rules={[{ required: true }]}><Select options={typeOptions} /></Form.Item>
      <Form.Item name="asset_name" label="关联公司（可选）"><Input placeholder="例如：腾讯控股" /></Form.Item>
      <Collapse ghost items={[{ key: 'optional', label: '补充信息（可选）', children: <>
        <Form.Item name="source_name" label="来源名称"><Input /></Form.Item>
        <Form.Item name="source_url" label="来源链接"><Input /></Form.Item>
        <Form.Item name="source_date" label="来源日期"><DatePicker style={{ width: '100%' }} /></Form.Item>
        <Form.Item
          name="personal_note"
          label="我的理解"
          extra="写下这条资料对你的判断意味着什么、有什么疑问或后续需要验证的地方；不要重复摘抄原文。"
        ><Input.TextArea rows={3} placeholder="例如：这支持了什么判断，还有哪些地方不能确定" /></Form.Item>
        <Form.Item name="images" label="重要图片" valuePropName="fileList" getValueFromEvent={(event) => event?.fileList}><Upload beforeUpload={() => false} maxCount={Math.max(0, 3 - (initial?.image_paths.length ?? 0))} accept="image/jpeg,image/png,image/webp"><span><UploadOutlined /> 选择图片</span></Upload></Form.Item>
      </> }]} />
    </Form>
  </Modal>;
}
