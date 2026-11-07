import { opportunities, daysLeft } from "./scholarships.ts";
export function preparationPlan(apps: Record<number, string>, ready: string[]) {
  const active = opportunities.filter((s) =>
    ["Planning", "In Progress", "Preparing", "Ready to submit"].includes(
      apps[s.id],
    ),
  );
  const missing = [...new Set(active.flatMap((s) => s.docs))].filter(
    (d) => !ready.includes(d),
  );
  return missing
    .map((document) => {
      const helped = active.filter((s) => s.docs.includes(document));
      return {
        document,
        helped,
        completes: helped.filter((s) =>
          s.docs.every((d) => d === document || ready.includes(d)),
        ).length,
        soonest: Math.min(...helped.map((s) => daysLeft(s))),
      };
    })
    .sort(
      (a, b) =>
        b.helped.length - a.helped.length ||
        b.completes - a.completes ||
        a.soonest - b.soonest ||
        a.document.localeCompare(b.document),
    );
}
