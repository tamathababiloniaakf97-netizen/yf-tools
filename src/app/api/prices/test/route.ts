import { NextResponse } from 'next/server';

/**
 * GET /api/prices/test
 * 调试接口：测试数据源
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || 'SPY';

  const results: Record<string, unknown> = {};

  // 搜索 SPY 在东方财富中的代码
  try {
    const searchRes = await fetch(
      `https://searchadapter.eastmoney.com/api/suggest/get?input=${code}&type=14&token=`,
      { headers: { 'Referer': 'https://quote.eastmoney.com/' } }
    );
    const searchText = await searchRes.text();
    results['search'] = searchText.substring(0, 1000);
  } catch (err) {
    results['search'] = { error: String(err) };
  }

  // 测试美股 ulget 批量接口
  try {
    const ulRes = await fetch(
      `https://push2.eastmoney.com/api/qt/stock/ulget?secids=105.${code},106.${code}&fields=f43,f44,f45,f46,f47,f48,f50,f57,f58,f170`,
      { headers: { 'Referer': 'https://quote.eastmoney.com/' } }
    );
    const ulText = await ulRes.text();
    results['ulget'] = ulText.substring(0, 1000);
  } catch (err) {
    results['ulget'] = { error: String(err) };
  }

  // 尝试 SPY 的美股代码格式
  try {
    // 东方财富美股代码可能是纯数字ID
    const altRes = await fetch(
      `https://push2.eastmoney.com/api/qt/stock/get?secid=106.SPY&fields=f43,f44,f45,f46,f47,f48,f50,f57,f58,f170`,
      { headers: { 'Referer': 'https://quote.eastmoney.com/' } }
    );
    const altText = await altRes.text();
    results['direct_106'] = altText.substring(0, 500);
  } catch (err) {
    results['direct_106'] = { error: String(err) };
  }

  return NextResponse.json(results);
}
