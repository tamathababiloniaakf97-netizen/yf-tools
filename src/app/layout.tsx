import type { Metadata } from 'next';
import './globals.css';
import AntdProvider from '@/components/AntdProvider';
import AppShell from '@/components/shell/AppShell';

export const metadata: Metadata = {
  title: '人生工作台',
  description: '将目标转化为行动，将行动转化为结果',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col">
        <AntdProvider>
          <AppShell>{children}</AppShell>
        </AntdProvider>
      </body>
    </html>
  );
}
