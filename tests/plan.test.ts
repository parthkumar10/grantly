import { test } from "node:test";
import assert from "node:assert/strict";
import { readPlan, planCsv } from "../lib/plan.ts";
test("corrupt saved JSON safely recovers", () => {
  for (const value of ["null", "[]", "{bad"])
    assert.deepEqual(readPlan(value).saved, []);
});
test("legacy fictional record IDs are rejected", () => {
  const p = readPlan(
    JSON.stringify({
      saved: [1, 101, 101, 999],
      apps: { 1: "Preparing", 101: "Submitted" },
      docs: ["Income certificate", "Made up"],
    }),
  );
  assert.deepEqual(p.saved, [101]);
  assert.deepEqual(p.apps, { 101: "Submitted" });
  assert.deepEqual(p.docs, ["Income certificate"]);
});
test("CSV includes provenance and defuses spreadsheet formula notes", () => {
  const csv = planCsv({ 101: "Submitted" }, [], { 101: "=SUM(1,2)" });
  assert.ok(csv.includes("AICTE Pragati"));
  assert.ok(csv.includes("verified"));
  assert.ok(csv.includes("'=SUM"));
});

test("invalid persisted profile values become unknown rather than false eligibility", () => {
  const p = readPlan(
    JSON.stringify({
      profile: {
        income: -100,
        percentile: "999",
        level: "Invented",
        gender: 42,
      },
    }),
  );
  assert.equal(p.profile.income, -1);
  assert.equal(p.profile.percentile, "");
  assert.equal(p.profile.level, "");
});

test("valid numeric eligibility answers persist in the profile", () => {
  const p = readPlan(
    JSON.stringify({
      profile: {
        income: 350000,
        percentile: "87.5",
        disability: "40",
        gapYears: "0",
        girlsSupported: "2",
      },
    }),
  );
  assert.equal(p.profile.income, 350000);
  assert.equal(p.profile.percentile, "87.5");
  assert.equal(p.profile.disability, "40");
  assert.equal(p.profile.gapYears, "0");
  assert.equal(p.profile.girlsSupported, "2");
});

test("valid income ranges persist and invalid ranges stay unknown", () => {
  const valid = readPlan(
    JSON.stringify({
      profile: { income: -1, incomeRange: "250001-450000" },
    }),
  );
  assert.equal(valid.profile.income, -1);
  assert.equal(valid.profile.incomeRange, "250001-450000");

  const invalid = readPlan(
    JSON.stringify({
      profile: { income: -1, incomeRange: "invented-range" },
    }),
  );
  assert.equal(invalid.profile.incomeRange, "");
});
