const dayMs = 24 * 60 * 60 * 1000;

function utcDay(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function actionDeadlineLabel(dueDate: string | null, today: string) {
  if (!dueDate) return '未定日期';
  const days = Math.round((utcDay(dueDate) - utcDay(today)) / dayMs);
  if (days < 0) return `逾期 ${Math.abs(days)} 天`;
  if (days === 0) return '今日截止';
  if (days === 1) return '明日截止';
  if (days <= 7) return `还有 ${days} 天`;
  const [, month, day] = dueDate.split('-').map(Number);
  return `${month}月${day}日截止`;
}
