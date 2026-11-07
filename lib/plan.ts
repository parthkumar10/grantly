import {
  initialProfile,
  opportunities,
  daysLeft,
  incomeRanges,
} from "./scholarships.ts";
export const statuses = [
  "Saved",
  "Planning",
  "In Progress",
  "Preparing",
  "Ready to submit",
  "Submitted",
  "Decision Pending",
  "Awarded",
  "Not selected",
];
export function readPlan(raw: string | null) {
  const empty = {
    saved: [] as number[],
    apps: {} as Record<number, string>,
    docs: [] as string[],
    profile: { ...initialProfile },
    notes: {} as Record<number, string>,
  };
  try {
    const d = JSON.parse(raw || "null");
    if (!d || typeof d !== "object" || Array.isArray(d)) return empty;
    const ids = new Set(opportunities.map((s) => s.id));
    const documents = new Set(opportunities.flatMap((s) => s.docs));
    if (Array.isArray(d.saved))
      empty.saved = [
        ...new Set<number>(
          d.saved.filter(
            (id: unknown) => typeof id === "number" && ids.has(id),
          ),
        ),
      ];
    if (Array.isArray(d.docs))
      empty.docs = [
        ...new Set<string>(
          d.docs.filter(
            (doc: unknown) => typeof doc === "string" && documents.has(doc),
          ),
        ),
      ];
    for (const s of opportunities) {
      if (statuses.includes(d.apps?.[s.id])) empty.apps[s.id] = d.apps[s.id];
      if (typeof d.notes?.[s.id] === "string")
        empty.notes[s.id] = d.notes[s.id].slice(0, 2000);
    }
    const p = d.profile;
    if (p && typeof p === "object") {
      if (typeof p.name === "string" && p.name.trim())
        empty.profile.name = p.name.trim().slice(0, 40);
      const choices: Record<string, string[]> = {
        level: ["", "Undergraduate", "Postgraduate", "Diploma"],
        field: ["Engineering", "Design", "Science", "Arts", "Commerce"],
        gender: ["Prefer not to say", "Woman", "Man", "Non-binary"],
        aicte: ["", "Yes", "No"],
        entry: ["", "First year", "Second year lateral", "Other"],
        regular: ["", "Yes", "No"],
        otherAid: ["", "Yes", "No"],
      };
      for (const [key, values] of Object.entries(choices))
        if (values.includes(p[key]))
          (empty.profile as Record<string, unknown>)[key] = p[key];
      if (
        typeof p.income === "number" &&
        Number.isFinite(p.income) &&
        p.income >= 0 &&
        p.income <= 100000000
      )
        empty.profile.income = p.income;
      if (
        incomeRanges.some((range) => range.value === p.incomeRange) &&
        empty.profile.income === -1
      )
        empty.profile.incomeRange = p.incomeRange;
      if (
        typeof p.grade === "number" &&
        Number.isFinite(p.grade) &&
        p.grade >= 0 &&
        p.grade <= 100
      )
        empty.profile.grade = p.grade;
      for (const key of [
        "percentile",
        "disability",
        "gapYears",
        "girlsSupported",
      ]) {
        const v = p[key],
          max = key === "gapYears" ? 30 : key === "girlsSupported" ? 20 : 100;
        if (
          typeof v === "string" &&
          v.trim() !== "" &&
          Number.isFinite(Number(v)) &&
          Number(v) >= 0 &&
          Number(v) <= max
        )
          (empty.profile as Record<string, unknown>)[key] = v;
      }
    }
    return empty;
  } catch {
    return empty;
  }
}
export function planCsv(
  apps: Record<number, string>,
  docs: string[],
  notes: Record<number, string>,
) {
  const rows = [
    [
      "Scholarship",
      "Provider",
      "Annual base amount INR",
      "Status",
      "Deadline",
      "Deadline verification",
      "Documents to prepare",
      "Personal notes",
    ],
    ...opportunities
      .filter((s) => apps[s.id])
      .map((s) => [
        s.name,
        s.org,
        String(s.amount),
        apps[s.id],
        s.deadline || "Unknown",
        s.deadlineStatus,
        s.docs.filter((d) => !docs.includes(d)).join("; "),
        notes[s.id] || "",
      ]),
  ];
  return (
    "\uFEFF" +
    rows
      .map((r) =>
        r
          .map(
            (c) =>
              '"' +
              (/^[=+@\-\t\r]/.test(c) ? "'" : "") +
              c.replaceAll('"', '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n")
  );
}
