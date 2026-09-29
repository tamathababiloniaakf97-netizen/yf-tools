const millisecondsPerDay = 24 * 60 * 60 * 1000;

function utcTimestamp(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function contactDaysLabel(lastContactAt: string | null, today: string) {
  if (!lastContactAt) return '未记录';
  const elapsed = Math.floor((utcTimestamp(today) - utcTimestamp(lastContactAt)) / millisecondsPerDay);
  return `${Math.max(0, elapsed)}天`;
}
