import {
  dailyThoughtThemes,
  dailyThoughts,
  type DailyThought,
  type DailyThoughtTheme,
} from "./daily-thoughts";

const DAY_MS = 24 * 60 * 60 * 1000;

const themeByWeekday: Record<number, DailyThoughtTheme> = {
  0: "review_self_awareness",
  1: "long_term_action",
  2: "investment_business",
  3: "relationships_parenting",
  4: "aesthetics_expression_reading",
  5: "rational_decision",
  6: "life_health_happiness",
};

function getShanghaiDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: read("year"), month: read("month"), day: read("day") };
}

function isValidThought(thought: DailyThought): boolean {
  return (
    dailyThoughtThemes.includes(thought.theme) &&
    [thought.id, thought.text, thought.attribution, thought.reflection, thought.sourceNote].every(
      (value) => typeof value === "string" && value.trim().length > 0,
    )
  );
}

function fallbackThought(theme: DailyThoughtTheme): DailyThought {
  return {
    id: `fallback-${theme}`,
    text: "先看清今天最重要的一件事，再开始行动。",
    attribution: "行动工作台",
    theme,
    reflection: "此刻最值得推进的一步是什么？",
    sourceNote: "内置降级内容。",
  };
}

export function selectDailyThought(
  now: Date,
  catalog: DailyThought[] = dailyThoughts,
): DailyThought {
  const { year, month, day } = getShanghaiDateParts(now);
  const daySerial = Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const theme = themeByWeekday[weekday];
  const candidates = catalog.filter(
    (thought) => thought.theme === theme && isValidThought(thought),
  );

  if (candidates.length === 0) return fallbackThought(theme);

  const index = Math.floor(daySerial / 7) % candidates.length;
  return candidates[index];
}
