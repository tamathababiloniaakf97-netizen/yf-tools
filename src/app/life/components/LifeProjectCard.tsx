'use client';

import { Button, Card, Empty, Flex, Popconfirm, Space, Tag, Typography } from 'antd';
import type { LifeReinforcementProject, LifeTrainingRecord } from '@/types/life-os';

type Props = {
  project: LifeReinforcementProject;
  records?: LifeTrainingRecord[];
  recordsOpen: boolean;
  loadingRecords: boolean;
  onEdit: () => void;
  onAddRecord: () => void;
  onToggleRecords: () => void;
  onEditRecord: (record: LifeTrainingRecord) => void;
  onDeleteRecord: (record: LifeTrainingRecord) => void;
  onDeleteProject: () => void;
};

export default function LifeProjectCard(props: Props) {
  const { project, records = [], recordsOpen, loadingRecords } = props;
  return <Card title={<Flex gap={8} align="center">{project.name}{!project.is_active && <Tag>已停用</Tag>}</Flex>} style={{ height: '100%' }}>
    <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
      <div><Typography.Text strong>长期目标</Typography.Text><Typography.Paragraph style={{ margin: '6px 0 0' }}>{project.long_term_goal || '尚未填写'}</Typography.Paragraph></div>
      <div><Typography.Text strong>训练阶段</Typography.Text><Flex wrap gap={6} style={{ marginTop: 8 }}>{project.stages.length ? project.stages.map((stage) => <Tag color="blue" key={stage}>{stage}</Tag>) : <Typography.Text type="secondary">尚未设置</Typography.Text>}</Flex></div>
      <div><Typography.Text strong>实用方法</Typography.Text><Typography.Paragraph style={{ margin: '6px 0 0' }}>{project.practical_method || '尚未填写'}</Typography.Paragraph></div>
      <Space wrap>
        <Button onClick={props.onEdit}>编辑项目</Button>
        {project.is_active && <Button type="primary" onClick={props.onAddRecord}>记录训练</Button>}
        <Button loading={loadingRecords} onClick={props.onToggleRecords}>{recordsOpen ? '收起记录' : '查看记录'}</Button>
        {!project.is_default && <Popconfirm title="删除项目及其全部训练记录？" onConfirm={props.onDeleteProject}><Button danger>删除项目</Button></Popconfirm>}
      </Space>
      {recordsOpen && <div>
        <Typography.Title level={5}>训练记录</Typography.Title>
        {!loadingRecords && records.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有训练记录" />}
        <Space orientation="vertical" style={{ width: '100%' }}>
          {records.map((record) => <Card size="small" key={record.id} title={record.trained_on} extra={<Space><Button type="link" onClick={() => props.onEditRecord(record)}>编辑</Button><Popconfirm title="删除这条训练记录？" onConfirm={() => props.onDeleteRecord(record)}><Button type="link" danger>删除</Button></Popconfirm></Space>}>
            {record.stage_name && <Tag color="geekblue">{record.stage_name}</Tag>}
            {record.session_goal && <Typography.Paragraph><strong>本次目标：</strong>{record.session_goal}</Typography.Paragraph>}
            <Typography.Paragraph><strong>做了什么：</strong>{record.activity}</Typography.Paragraph>
            {record.result_notes && <Typography.Paragraph style={{ marginBottom: 0 }}><strong>结果或感受：</strong>{record.result_notes}</Typography.Paragraph>}
          </Card>)}
        </Space>
      </div>}
    </Space>
  </Card>;
}
