import { readFile, writeFile } from "node:fs/promises";
import { parseNspListing } from "./nsp-listing.mjs";

const source = "https://scholarships.gov.in/All-Scholarships";
const response = await fetch(source, {
  headers: { "user-agent": "Grantly scholarship-source-check/1.0" },
  signal: AbortSignal.timeout(20000),
});

if (!response.ok) {
  throw new Error(`NSP listing request failed with HTTP ${response.status}`);
}

const html = await response.text();
if (!html.includes("Scholarship") || html.length < 1000) {
  throw new Error("NSP listing response did not contain the expected page");
}

const existing = JSON.parse(
  await readFile(new URL("../data/nsp-schemes.json", import.meta.url), "utf8"),
);
const records = JSON.parse(
  await readFile(new URL("../data/scholarships.json", import.meta.url), "utf8"),
);
const sourceChecked = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
}).format(new Date());
const curatedSchemes = [
  { pattern: /^AICTE\s*-\s*Pragati.*Technical Degree/i, id: 101 },
  { pattern: /^AICTE\s*-\s*Pragati.*Technical Diploma/i, id: 102 },
  { pattern: /^AICTE\s*-\s*Saksham.*Technical Degree/i, id: 103 },
  { pattern: /^AICTE\s*-\s*Saksham.*Technical Diploma/i, id: 105 },
  { pattern: /^PM-USP.*CSSS/i, id: 104 },
];
const updated = parseNspListing(html, existing, sourceChecked).map((scheme) => {
  const curated = curatedSchemes.find(({ pattern }) =>
    pattern.test(scheme.name),
  );
  const record = records.find((item) => item.id === curated?.id);
  return record
    ? {
        ...scheme,
        catalogId: record.id,
        coverage: "Eligibility facts curated separately",
      }
    : scheme;
});

const minimumExpected = Math.max(10, Math.floor(existing.length * 0.75));
if (updated.length < minimumExpected) {
  throw new Error(
    `Only ${updated.length} schemes were parsed; expected at least ${minimumExpected}, refusing to replace the inventory`,
  );
}

await writeFile(
  new URL("../data/nsp-schemes.json", import.meta.url),
  `${JSON.stringify(updated, null, 2)}\n`,
);
console.log(
  `Updated ${updated.length} NSP-listed schemes from ${source}. Eligibility records were not changed.`,
);
