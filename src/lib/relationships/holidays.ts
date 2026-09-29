export type TraditionalHoliday = {
  key: 'spring_festival' | 'dragon_boat' | 'mid_autumn';
  name: '春节' | '端午' | '中秋';
  date: string;
};

const holidayRules: Array<Omit<TraditionalHoliday, 'date'> & { lunarMonth: string; lunarDay: number }> = [
  { key: 'spring_festival', name: '春节', lunarMonth: '正月', lunarDay: 1 },
  { key: 'dragon_boat', name: '端午', lunarMonth: '五月', lunarDay: 5 },
  { key: 'mid_autumn', name: '中秋', lunarMonth: '八月', lunarDay: 15 },
];

const lunarFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
  timeZone: 'Asia/Shanghai',
  month: 'long',
  day: 'numeric',
});

function dateString(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function traditionalHolidaysForYear(year: number): TraditionalHoliday[] {
  const found = new Map<TraditionalHoliday['key'], TraditionalHoliday>();
  const cursor = new Date(`${dateString(year, 1, 1)}T12:00:00+08:00`);
  const end = new Date(`${dateString(year, 12, 31)}T12:00:00+08:00`);

  while (cursor <= end && found.size < holidayRules.length) {
    const parts = lunarFormatter.formatToParts(cursor);
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = Number(parts.find((part) => part.type === 'day')?.value);

    for (const rule of holidayRules) {
      if (!found.has(rule.key) && month === rule.lunarMonth && day === rule.lunarDay) {
        found.set(rule.key, { key: rule.key, name: rule.name, date: dateString(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate()) });
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return holidayRules.flatMap((rule) => {
    const holiday = found.get(rule.key);
    return holiday ? [holiday] : [];
  });
}
