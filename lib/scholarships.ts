import dataset from "../data/scholarships.json" with { type: "json" };
export type Rule = {
  field: string;
  label: string;
  op: string;
  value: unknown;
  info: string;
};
export type Scholarship = (typeof dataset)[number];
export const initialProfile = {
  name: "Student",
  field: "Engineering",
  level: "",
  income: -1,
  incomeRange: "",
  grade: 0,
  gender: "Prefer not to say",
  aicte: "",
  entry: "",
  gapYears: "",
  otherAid: "",
  girlsSupported: "",
  disability: "",
  percentile: "",
  regular: "",
};
export type StudentProfile = typeof initialProfile;
export const opportunities = dataset;
export const money = (n: number) => "₹" + n.toLocaleString("en-IN");
export const incomeRanges = [
  { value: "up-to-250000", label: "₹0 – ₹2.5 lakh", min: 0, max: 250000 },
  {
    value: "250001-450000",
    label: "₹2.5 – ₹4.5 lakh",
    min: 250001,
    max: 450000,
  },
  {
    value: "450001-800000",
    label: "₹4.5 – ₹8 lakh",
    min: 450001,
    max: 800000,
  },
  {
    value: "above-800000",
    label: "Above ₹8 lakh",
    min: 800001,
    max: 100000000,
  },
] as const;
export function eligibilityChecks(s: Scholarship, p: StudentProfile) {
  return s.rules.map((r: Rule) => {
    const v = (p as unknown as Record<string, unknown>)[r.field];
    const incomeRange =
      r.field === "income"
        ? incomeRanges.find((range) => range.value === p.incomeRange)
        : undefined;
    const unknown =
      v === undefined ||
      v === null ||
      v === "" ||
      v === "Prefer not to say" ||
      (v === -1 && !incomeRange);
    let pass: boolean | null = null;
    if (!unknown) {
      if (incomeRange) {
        const limit = Number(r.value);
        switch (r.op) {
          case "lte":
            pass =
              incomeRange.max <= limit
                ? true
                : incomeRange.min > limit
                  ? false
                  : null;
            break;
          case "gte":
            pass =
              incomeRange.min >= limit
                ? true
                : incomeRange.max < limit
                  ? false
                  : null;
            break;
          case "gt":
            pass =
              incomeRange.min > limit
                ? true
                : incomeRange.max <= limit
                  ? false
                  : null;
            break;
        }
      } else {
        switch (r.op) {
          case "eq":
            pass =
              typeof r.value === "number"
                ? Number(v) === r.value
                : v === r.value;
            break;
          case "in":
            pass = (r.value as unknown[]).includes(v);
            break;
          case "lte":
            pass = Number(v) <= Number(r.value);
            break;
          case "gte":
            pass = Number(v) >= Number(r.value);
            break;
          case "gt":
            pass = Number(v) > Number(r.value);
        }
      }
    }
    return {
      label: r.label,
      pass,
      info: r.info + (unknown ? " · information missing" : ""),
      field: r.field,
    };
  });
}
export function eligibilityStatus(s: Scholarship, p: StudentProfile) {
  const c = eligibilityChecks(s, p);
  if (c.some((x) => x.pass === false)) return "Ineligible";
  if (c.every((x) => x.pass === null)) return "Insufficient Information";
  if (c.some((x) => x.pass === null)) return "Potentially Eligible";
  return "Eligible";
}
export function matchScore(s: Scholarship, p: StudentProfile) {
  const c = eligibilityChecks(s, p);
  return Math.round((c.filter((x) => x.pass === true).length / c.length) * 100);
}
export function documentReadiness(s: Scholarship, d: string[]) {
  return Math.round(
    (s.docs.filter((x) => d.includes(x)).length / s.docs.length) * 100,
  );
}
export function daysLeft(s: Scholarship, now = new Date()) {
  if (!s.deadline || s.deadlineStatus !== "verified") return Infinity;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return Math.round(
    (Date.parse(s.deadline + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) /
      86400000,
  );
}
export function deadlineLabel(s: Scholarship) {
  const d = daysLeft(s);
  return !Number.isFinite(d)
    ? "Deadline needs confirmation"
    : d < 0
      ? "Deadline passed"
      : d === 0
        ? "Due today"
        : d + " days left";
}
export function compareDeadlines(
  a: Scholarship,
  b: Scholarship,
  now = new Date(),
) {
  const left = daysLeft(a, now);
  const right = daysLeft(b, now);
  const category = (days: number) =>
    days < 0 ? 2 : Number.isFinite(days) ? 0 : 1;
  const order = category(left) - category(right);
  if (order) return order;
  if (category(left) === 2) return right - left;
  return left - right;
}
