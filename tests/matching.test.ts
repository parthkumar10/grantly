import assert from "node:assert/strict";
import { test } from "node:test";
import {
  opportunities,
  initialProfile,
  eligibilityStatus,
  eligibilityChecks,
  daysLeft,
  documentReadiness,
  compareDeadlines,
} from "../lib/scholarships.ts";
const complete = {
  ...initialProfile,
  level: "Undergraduate",
  gender: "Woman",
  income: 800000,
  aicte: "Yes",
  entry: "First year",
  gapYears: "0",
  otherAid: "No",
  girlsSupported: "2",
};
test("missing profile yields insufficient information rather than eligibility", () =>
  assert.equal(
    eligibilityStatus(opportunities[0], initialProfile),
    "Insufficient Information",
  ));
test("Pragati inclusive income ceiling and household criteria", () => {
  assert.equal(eligibilityStatus(opportunities[0], complete), "Eligible");
  assert.equal(
    eligibilityStatus(opportunities[0], { ...complete, income: 800001 }),
    "Ineligible",
  );
  assert.equal(
    eligibilityStatus(opportunities[0], { ...complete, girlsSupported: "3" }),
    "Ineligible",
  );
});
test("income ranges only confirm eligibility when the full range fits the limit", () => {
  const profile = { ...complete, income: -1, incomeRange: "450001-800000" };
  assert.equal(eligibilityStatus(opportunities[0], profile), "Eligible");
  assert.equal(eligibilityStatus(opportunities[3], profile), "Ineligible");
  assert.equal(
    eligibilityStatus(opportunities[3], {
      ...profile,
      incomeRange: "250001-450000",
    }),
    "Potentially Eligible",
  );
  assert.equal(
    eligibilityStatus(opportunities[0], {
      ...profile,
      incomeRange: "above-800000",
    }),
    "Ineligible",
  );
});
test("unknown conditions remain potentially eligible", () =>
  assert.equal(
    eligibilityStatus(opportunities[0], { ...complete, aicte: "" }),
    "Potentially Eligible",
  ));
test("CSSS uses percentile strictly above 80, not marks", () => {
  const p = {
    ...complete,
    income: 450000,
    regular: "Yes",
    percentile: "80",
    grade: 99,
  };
  assert.equal(eligibilityStatus(opportunities[3], p), "Ineligible");
  assert.equal(
    eligibilityStatus(opportunities[3], { ...p, percentile: "80.1" }),
    "Eligible",
  );
});
test("Saksham disability boundary is inclusive", () => {
  assert.equal(
    eligibilityStatus(opportunities[2], { ...complete, disability: "40" }),
    "Eligible",
  );
  assert.equal(
    eligibilityStatus(opportunities[2], { ...complete, disability: "39" }),
    "Ineligible",
  );
});
test("Saksham diploma uses official course, disability and income criteria", () => {
  const p = {
    ...complete,
    level: "Diploma",
    disability: "40",
    income: 800000,
    entry: "Second year lateral",
  };
  assert.equal(eligibilityStatus(opportunities[4], p), "Eligible");
  assert.equal(
    eligibilityStatus(opportunities[4], { ...p, disability: "39" }),
    "Ineligible",
  );
  assert.equal(
    eligibilityStatus(opportunities[4], { ...p, income: 800001 }),
    "Ineligible",
  );
  assert.equal(
    eligibilityStatus(opportunities[4], { ...p, level: "Undergraduate" }),
    "Ineligible",
  );
});
test("diploma and degree are separate eligibility routes", () =>
  assert.equal(eligibilityStatus(opportunities[1], complete), "Ineligible"));
test("deadline arithmetic uses Indian calendar days", () => {
  assert.equal(daysLeft(opportunities[0], new Date("2026-11-29T18:30:00Z")), 0);
  assert.equal(
    daysLeft(opportunities[0], new Date("2026-12-01T00:00:00Z")),
    -1,
  );
  assert.equal(daysLeft(opportunities[3]), Infinity);
});
test("deadline sorting puts upcoming first, unconfirmed next, and expired last", () => {
  const now = new Date("2026-11-07T18:30:00Z");
  const upcoming = { ...opportunities[0], deadline: "2026-11-10" };
  const unconfirmed = { ...opportunities[3] };
  const expired = { ...opportunities[0], deadline: "2026-11-06" };
  assert.ok(compareDeadlines(upcoming, unconfirmed, now) < 0);
  assert.ok(compareDeadlines(unconfirmed, expired, now) < 0);
  assert.ok(compareDeadlines(upcoming, expired, now) < 0);
  assert.ok(daysLeft(upcoming, now) > 0);
});
test("document progress ignores unrelated records", () =>
  assert.equal(
    documentReadiness(opportunities[0], ["Income certificate", "Unrelated"]),
    33,
  ));
