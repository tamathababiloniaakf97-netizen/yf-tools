import type { Metadata } from 'next';
import './globals.css';
import AntdProvider from '@/components/AntdProvider';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: '远峯投资策略工作台',
  description: '记录投资成本、追踪持仓表现',
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
          <Navbar />
          <main className="yf-main-content" style={{ flex: 1, padding: '20px 32px', maxWidth: 1600, width: '100%', margin: '0 auto' }}>
            {children}
          </main>
        </AntdProvider>
      </body>
    </html>
  );
}
