import { test } from "node:test";
import assert from "node:assert/strict";
import { preparationPlan } from "../lib/preparation.ts";
test("shared documents benefit both active applications", () => {
  assert.equal(
    preparationPlan({ 101: "Planning", 103: "In Progress" }, [])[0].helped
      .length,
    2,
  );
});
test("closed and submitted plans are excluded", () =>
  assert.deepEqual(
    preparationPlan(
      { 101: "Submitted", 102: "Awarded", 103: "Decision Pending" },
      [],
    ),
    [],
  ));
test("completed checklists have no pending preparation", () =>
  assert.deepEqual(
    preparationPlan({ 101: "Planning" }, [
      "Income certificate",
      "Enrollment proof",
      "Academic transcript",
    ]),
    [],
  ));
