'use client';

import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Card, Spin, Alert, Row, Col, Statistic } from 'antd';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface NavDataPoint {
  date: string;
  nav: number;
}

interface ChartMetrics {
  twrReturn: number;
  annualizedReturn: number | null;
  maxDrawdown: number;
  spyReturn: number | null;
  spyAnnual: number | null;
  spyMaxDd: number;
  excessReturn: number | null;
}

interface Props {
  userNav: NavDataPoint[];
  spyNav: NavDataPoint[];
  loading: boolean;
  warning?: string;
  metrics?: ChartMetrics | null;
  periodLabel?: string;
}

export default function NavChart({ userNav, spyNav, loading, warning, metrics, periodLabel }: Props) {
  const option = useMemo(() => {
    if (userNav.length === 0) return null;

    const allDates = new Set<string>();
    userNav.forEach((d) => allDates.add(d.date));
    spyNav.forEach((d) => allDates.add(d.date));
    const dates = Array.from(allDates).sort();

    const userMap = new Map(userNav.map((d) => [d.date, d.nav]));
    const spyMap = new Map(spyNav.map((d) => [d.date, d.nav]));

    const userValues = dates.map((d) => userMap.get(d) ?? null);
    const spyValues = dates.map((d) => spyMap.get(d) ?? null);

    // 前向填充用户净值，使曲线连续（NAV 仅在交易日出点，非交易日沿用上日净值）
    let lastKnown: number | null = null;
    for (let i = 0; i < userValues.length; i++) {
      if (userValues[i] !== null) {
        lastKnown = userValues[i];
      } else {
        userValues[i] = lastKnown;
      }
    }

    return {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (val: number | null) => (val !== null ? val.toFixed(4) : '—'),
      },
      legend: { data: ['策略净值(TWR)', '标普500'], top: 0 },
      grid: { left: 50, right: 20, bottom: 30, top: 40 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { rotate: 45, fontSize: 10 },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { formatter: (v: number) => v.toFixed(3) },
        splitLine: { lineStyle: { type: 'dashed' } },
      },
      series: [
        {
          name: '策略净值(TWR)',
          type: 'line',
          data: userValues,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.04 },
        },
        {
          name: '标普500',
          type: 'line',
          data: spyValues,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, type: 'dashed' },
          itemStyle: { color: '#faad14' },
        },
      ],
    };
  }, [userNav, spyNav]);

  return (
    <Card title={`净值走势图${periodLabel ? ` · ${periodLabel}` : ''}`} size="small">
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : userNav.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          暂无净值数据，录入交易后自动生成
        </div>
      ) : (
        <>
          {metrics && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Statistic
                  title="策略收益率(TWR)"
                  value={metrics.twrReturn}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: metrics.twrReturn >= 0 ? '#f5222d' : '#52c41a', fontSize: 20 }}
                />
                {metrics.spyReturn !== null && (
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    标普500: {metrics.spyReturn >= 0 ? '+' : ''}{metrics.spyReturn.toFixed(2)}%
                  </div>
                )}
                {metrics.excessReturn !== null && (
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    超额收益: {metrics.excessReturn >= 0 ? '+' : ''}{metrics.excessReturn.toFixed(2)}%
                  </div>
                )}
              </Col>
              <Col span={8}>
                <Statistic
                  title="年化收益率"
                  value={metrics.annualizedReturn ?? 0}
                  precision={2}
                  suffix={metrics.annualizedReturn !== null ? '%' : '(不足60天)'}
                  valueStyle={{ color: (metrics.annualizedReturn ?? 0) >= 0 ? '#f5222d' : '#52c41a', fontSize: 20 }}
                />
                {metrics.spyAnnual !== null && (
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    标普500: {metrics.spyAnnual >= 0 ? '+' : ''}{metrics.spyAnnual.toFixed(2)}%
                  </div>
                )}
              </Col>
              <Col span={8}>
                <Statistic
                  title="最大回撤"
                  value={metrics.maxDrawdown}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#fa8c16', fontSize: 20 }}
                />
                {metrics.spyMaxDd > 0 && (
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    标普500: {metrics.spyMaxDd.toFixed(2)}%
                  </div>
                )}
              </Col>
            </Row>
          )}

          {option && (
            <ReactEChartsCore
              echarts={echarts}
              option={option}
              style={{ height: 350 }}
              notMerge
            />
          )}

          {warning && (
            <Alert message={warning} type="warning" showIcon style={{ marginTop: 8 }} />
          )}
        </>
      )}
    </Card>
  );
}
