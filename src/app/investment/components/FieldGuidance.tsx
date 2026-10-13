import type { ReactNode } from 'react';
import { Tag, Typography } from 'antd';

export default function FieldGuidance({ children, financialEvidence }: { children: ReactNode; financialEvidence?: string }) {
  return (
    <div className="investment-field-guidance-group">
      <Typography.Text type="secondary" className="investment-field-guidance">{children}</Typography.Text>
      {financialEvidence && (
        <div style={{ marginTop: 4 }}>
          <Tag color="blue" bordered={false}>财务佐证</Tag>
          <Typography.Text type="secondary">{financialEvidence}</Typography.Text>
        </div>
      )}
    </div>
  );
}
