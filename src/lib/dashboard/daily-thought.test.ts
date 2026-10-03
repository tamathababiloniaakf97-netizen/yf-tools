import { describe, expect, it } from "vitest";

import { selectDailyThought } from "./daily-thought";
import {
  dailyThoughtThemes,
  dailyThoughts,
  type DailyThoughtTheme,
} from "./daily-thoughts";

const weekdayCases: Array<[string, DailyThoughtTheme]> = [
  ["2026-09-28T08:00:00+08:00", "long_term_action"],
  ["2026-09-29T08:00:00+08:00", "investment_business"],
  ["2026-09-30T08:00:00+08:00", "relationships_parenting"],
  ["2026-10-01T08:00:00+08:00", "aesthetics_expression_reading"],
  ["2026-10-02T08:00:00+08:00", "rational_decision"],
  ["2026-10-03T08:00:00+08:00", "life_health_happiness"],
  ["2026-10-04T08:00:00+08:00", "review_self_awareness"],
];

describe("daily thought catalog", () => {
  it("contains seven themes and at least five complete entries for each theme", () => {
    expect(dailyThoughtThemes).toHaveLength(7);

    for (const theme of dailyThoughtThemes) {
      const entries = dailyThoughts.filter((thought) => thought.theme === theme);
      expect(entries.length, theme).toBeGreaterThanOrEqual(5);
    }

    const ids = dailyThoughts.map((thought) => thought.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const thought of dailyThoughts) {
      expect(thought.id.trim()).not.toBe("");
      expect(thought.text.trim()).not.toBe("");
      expect(thought.attribution.trim()).not.toBe("");
      expect(thought.reflection.trim()).not.toBe("");
      expect(thought.sourceNote.trim()).not.toBe("");
    }
  });
});

describe("selectDailyThought", () => {
  it.each(weekdayCases)("maps %s to %s", (instant, expectedTheme) => {
    expect(selectDailyThought(new Date(instant)).theme).toBe(expectedTheme);
  });

  it("returns the same thought throughout one Shanghai calendar day", () => {
    const morning = selectDailyThought(new Date("2026-10-02T00:01:00+08:00"));
    const evening = selectDailyThought(new Date("2026-10-02T23:59:00+08:00"));

    expect(evening.id).toBe(morning.id);
  });

  it("does not repeat a weekday thought within five successive weeks", () => {
    const ids = Array.from({ length: 5 }, (_, week) =>
      selectDailyThought(
        new Date(`2026-10-${String(2 + week * 7).padStart(2, "0")}T08:00:00+08:00`),
      ).id,
    );

    expect(new Set(ids).size).toBe(5);
  });

  it("returns a neutral fallback when the supplied catalog is invalid", () => {
    const invalidCatalog = [
      {
        id: "incomplete",
        text: "",
        attribution: "",
        theme: "rational_decision" as const,
        reflection: "",
        sourceNote: "",
      },
    ];

    expect(selectDailyThought(new Date("2026-10-02T08:00:00+08:00"), invalidCatalog)).toMatchObject({
      id: "fallback-rational_decision",
      attribution: "行动工作台",
      theme: "rational_decision",
    });
  });
});
