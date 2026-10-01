import type { ReactNode } from 'react';
import { Typography } from 'antd';

export default function FieldGuidance({ children }: { children: ReactNode }) {
  return (
    <Typography.Text type="secondary" className="investment-field-guidance">
      {children}
    </Typography.Text>
  );
}
