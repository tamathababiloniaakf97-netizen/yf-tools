'use client';
import { useState } from 'react';
import { BookOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Drawer, Space, Typography } from 'antd';

const { Paragraph, Text, Title } = Typography;

export default function FinanceGuideDrawer() {
  const [open, setOpen] = useState(false);
  return <>
    <Button aria-label="填写说明" icon={<BookOutlined />} onClick={() => setOpen(true)}>填写说明</Button>
    <Drawer title="家庭财务填写说明" placement="right" size="large" open={open} onClose={() => setOpen(false)}>
      <Alert type="info" showIcon title="先建资产与负债，再记收支，月底结账" />
      <Title level={5}>1. 平时记在哪里</Title>
      <Paragraph><Text strong>经营收支：</Text>教培实际收到和实际支付的钱。</Paragraph>
      <Paragraph><Text strong>家庭收支：</Text>工资、报销返还、吃住行、教育和保险等。</Paragraph>
      <Paragraph><Text strong>其他大额事项：</Text>资产买卖、借款还款、证券资金转入或转出。</Paragraph>
      <Divider />
      <Title level={5}>2. 三个常见例子</Title>
      <Paragraph><Text strong>房贷：</Text>月供 ¥8,000，其中本金 ¥5,500、利息 ¥2,500。选择“房贷还款”，本金填 5,500，利息填 2,500；只有利息计入家庭支出。</Paragraph>
      <Paragraph><Text strong>信用卡：</Text>本月刷卡消费 ¥12,000，在“家庭支出”记录；还款 ¥10,000 时选择“信用卡还款”。还信用卡时不要再次记家庭支出。</Paragraph>
      <Paragraph><Text strong>证券入金：</Text>银行卡转入证券账户 ¥50,000，选择“投资转入”。这只是资金换位置，不影响家庭净资产，也不算投资亏损。</Paragraph>
      <Divider />
      <Title level={5}>3. 不要重复记录</Title>
      <Space orientation="vertical" size={6}>
        <Text>• 教培收入不要再记成家庭收入。</Text>
        <Text>• 信用卡消费记过家庭支出后，还款不再记支出。</Text>
        <Text>• 贷款本金不是支出，贷款利息才是支出。</Text>
        <Text>• 股票涨跌由投资模块和月末快照处理。</Text>
      </Space>
      <Divider />
      <Title level={5}>4. 月底怎么做</Title>
      <Paragraph>核对银行卡和现金余额，更新每笔房贷、信用贷及信用卡未还余额，确认投资快照和手工汇率，然后完成月度结账。结账后发现错误，先重新打开该月份，再修改并重新结账。</Paragraph>
    </Drawer>
  </>;
}
