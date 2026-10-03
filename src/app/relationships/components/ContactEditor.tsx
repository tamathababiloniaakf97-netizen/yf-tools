'use client';
import { Cascader, DatePicker, Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect } from 'react';
import type { Contact, ContactInput } from '@/types/life-os';

const relationshipOptions = [
  { value: 'family', label: '家庭' }, { value: 'friend', label: '朋友' }, { value: 'classmate', label: '同学' },
  { value: 'work', label: '工作' }, { value: 'professional', label: '专业人士' }, { value: 'other', label: '其他' },
];

type ContactFormValues = ContactInput & {
  birthday_year_known?: boolean;
  solar_birthday?: Dayjs | null;
  lunar_birthday?: number[];
};

const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
const lunarOptions = lunarMonths.map((label, month) => ({ label, value: month + 1, children: lunarDays.map((dayLabel, day) => ({ label: dayLabel, value: day + 1 })) }));

function solarBirthday(initial: Contact | null) {
  if (initial?.birthday_calendar !== 'solar' || !initial.birthday_month || !initial.birthday_day) return null;
  return dayjs().year(initial.birthday_year ?? 2000).month(initial.birthday_month - 1).date(initial.birthday_day);
}

export default function ContactEditor({ open, initial, saving, onCancel, onSubmit }: { open: boolean; initial: Contact | null; saving: boolean; onCancel: () => void; onSubmit: (value: ContactInput) => Promise<void> }) {
  const [form] = Form.useForm<ContactFormValues>();
  const calendar = Form.useWatch('birthday_calendar', form);
  const knowsBirthYear = Form.useWatch('birthday_year_known', form);
  useEffect(() => { if (open) { form.resetFields(); form.setFieldsValue(initial ? { ...initial, birthday_year_known: initial.birthday_year != null, solar_birthday: solarBirthday(initial), lunar_birthday: initial.birthday_calendar === 'lunar' && initial.birthday_month && initial.birthday_day ? [initial.birthday_month, initial.birthday_day] : undefined } : { relationship_type: 'friend', birthday_year_known: false, birthday_is_leap_month: false, birthday_reminder_enabled: true, holiday_contact_reminder_enabled: false }); } }, [form, initial, open]);
  const submit = async () => {
    const values = await form.validateFields();
    const { birthday_year_known, solar_birthday, lunar_birthday, ...contact } = values;
    const isSolar = contact.birthday_calendar === 'solar';
    const birthdayMonth = isSolar ? solar_birthday?.month() != null ? solar_birthday.month() + 1 : null : lunar_birthday?.[0] ?? null;
    const birthdayDay = isSolar ? solar_birthday?.date() ?? null : lunar_birthday?.[1] ?? null;
    const birthdayYear = birthday_year_known ? (isSolar ? solar_birthday?.year() ?? null : contact.birthday_year ?? null) : null;
    await onSubmit({ ...contact, birthday_year: birthdayYear, birthday_month: birthdayMonth, birthday_day: birthdayDay, birthday_is_leap_month: contact.birthday_calendar === 'lunar' ? contact.birthday_is_leap_month : false });
  };
  return <Modal title={initial ? '编辑联系人' : '新建联系人'} open={open} width={620} confirmLoading={saving} onCancel={onCancel} onOk={() => void submit()}><Form form={form} layout="vertical">
    <div className="plan-form-grid"><Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="relationship_type" label="关系类型" rules={[{ required: true }]}><Select options={relationshipOptions} /></Form.Item></div>
    <div className="plan-form-grid"><Form.Item name="role" label="职业或角色"><Input /></Form.Item><Form.Item name="met_context" label="认识背景" extra="在哪里、通过谁、因为什么认识。"><Input /></Form.Item></div>
    <div className="plan-form-grid"><Form.Item name="birthday_calendar" label="生日历法"><Select allowClear options={[{ value: 'solar', label: '公历' }, { value: 'lunar', label: '农历' }]} /></Form.Item><Form.Item name="birthday_year_known" label="知道出生年份" valuePropName="checked"><Switch /></Form.Item></div>
    {calendar === 'solar' && <Form.Item name="solar_birthday" label="公历生日" rules={[{ required: true, message: '请选择生日' }]}><DatePicker format={knowsBirthYear ? 'YYYY年MM月DD日' : 'MM月DD日'} placeholder="选择生日" style={{ width: '100%' }} /></Form.Item>}
    {calendar === 'lunar' && <><div className="plan-form-grid"><Form.Item name="lunar_birthday" label="农历生日" rules={[{ required: true, message: '请选择农历月日' }]}><Cascader options={lunarOptions} placeholder="选择农历月日" /></Form.Item>{knowsBirthYear && <Form.Item name="birthday_year" label="出生年份" rules={[{ required: true, message: '请填写出生年份' }]}><InputNumber min={1900} max={2100} style={{ width: '100%' }} /></Form.Item>}</div><Form.Item name="birthday_is_leap_month" label="闰月" valuePropName="checked"><Switch /></Form.Item></>}
    <Form.Item name="birthday_reminder_enabled" label="生日提醒" valuePropName="checked" extra="生日前7天和当天提醒。"><Switch /></Form.Item>
    <Form.Item name="holiday_contact_reminder_enabled" label="重要节日联系提示" valuePropName="checked" extra="春节、端午和中秋前3天开始提示。"><Switch /></Form.Item>
    <Form.Item name="family_context" label="家庭近况" extra="可记录：孩子几个及年龄阶段、配偶的一个特征或近期状态、父母情况、家庭近期重要变化。只记有助于理解和联系的信息。"><Input.TextArea rows={2} /></Form.Item>
    <Form.Item name="work_context" label="工作近况" extra="可记录：所在行业与公司、岗位职责、当前项目、职业变化、工作压力或近期关注。"><Input.TextArea rows={2} /></Form.Item>
    <Form.Item name="important_notes" label="观察与相处提示" extra="记录具体事实：性格表现、如何对待承诺和他人、核心关注或利益关系、沟通偏好、边界与风险。避免只写主观标签。"><Input.TextArea rows={3} /></Form.Item>
    <div className="plan-form-grid"><Form.Item name="last_contact_at" label="最近联系日期"><Input type="date" /></Form.Item><Form.Item name="next_contact_at" label="计划联系日期"><Input type="date" /></Form.Item></div>
    <Form.Item name="next_action" label="我的下一步行动" extra="写你准备做的具体动作，例如：周五把合同资料发给他。"><Input /></Form.Item>
    <Form.Item name="notes" label="其他备注" extra="记录不属于以上分类、但以后需要查阅的信息；不要保存高敏感隐私。"><Input.TextArea rows={2} /></Form.Item>
  </Form></Modal>;
}
