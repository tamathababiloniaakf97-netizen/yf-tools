'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { SWRConfig } from 'swr';
import { fetchJson } from '@/lib/api/fetch-json';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <SWRConfig value={{
        fetcher: fetchJson,
        dedupingInterval: 10_000,
        keepPreviousData: true,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}>
        <App>{children}</App>
      </SWRConfig>
    </ConfigProvider>
  );
}
