import assert from "node:assert/strict";
import test from "node:test";
import { parseNspListing } from "../scripts/nsp-listing.mjs";

test("NSP parser captures unique official listings, deadlines, and links", () => {
  const html = `
    <h6>AICTE - Pragati &amp; Support ( Technical Degree) (Merit Based Scheme)</h6>
    <span>Student Application Open till : 30-11-2026</span>
    <a href="https://scholarships.gov.in/guide.pdf">Scheme Guidelines</a>
    <h6>by AICTE</h6>
    <h6>AICTE - Pragati &amp; Support ( Technical Degree) (Merit Based Scheme)</h6>
    <span>Student Application Closed on : 30-11-2026</span>
  `;
  const schemes = parseNspListing(html, [], "2026-11-07");

  assert.equal(schemes.length, 1);
  assert.equal(
    schemes[0].name,
    "AICTE - Pragati & Support ( Technical Degree) (Merit Based Scheme)",
  );
  assert.deepEqual(
    schemes[0].listingWindows.map((window) => window.listingDetails[0]),
    [
      "Student Application Open till : 30-11-2026",
      "Student Application Closed on : 30-11-2026",
    ],
  );
  assert.equal(
    schemes[0].listingWindows[0].links[0].url,
    "https://scholarships.gov.in/guide.pdf",
  );
  assert.equal("listingDetails" in schemes[0], false);
  assert.equal("links" in schemes[0], false);
});

test("NSP refresh preserves reviewed coverage notes for existing schemes", () => {
  const schemes = parseNspListing(
    "<h6>Pragati (Merit Based Scheme)</h6><span>Application Open till: 30-11-2026</span>",
    [
      {
        name: "Pragati (Merit Based Scheme)",
        coverage: "Eligibility facts curated separately",
        verifiedRules: ["income"],
      },
    ],
    "2026-11-07",
  );

  assert.equal(schemes[0].coverage, "Eligibility facts curated separately");
  assert.deepEqual(schemes[0].verifiedRules, ["income"]);
});

test("NSP refresh drops non-HTTPS links", () => {
  const schemes = parseNspListing(
    `<h6>Example (Merit Based Scheme)</h6>
     <a href="javascript:alert(1)">FAQ</a>
     <a href="https://scholarships.gov.in/faq.pdf">FAQ</a>`,
    [],
    "2026-11-07",
  );

  assert.deepEqual(schemes[0].listingWindows[0].links, [
    { label: "FAQ", url: "https://scholarships.gov.in/faq.pdf" },
  ]);
});

test("NSP refresh removes unsafe legacy links from existing records", () => {
  const schemes = parseNspListing(
    `<h6>Example (Merit Based Scheme)</h6>
     <a href="https://scholarships.gov.in/new.pdf">FAQ</a>`,
    [
      {
        name: "Example (Merit Based Scheme)",
        listingWindows: [
          {
            listingDetails: ["Student Application Open till: 30-11-2026"],
            links: [
              { label: "FAQ", url: "null" },
              { label: "FAQ", url: "javascript:alert(1)" },
            ],
          },
        ],
      },
    ],
    "2026-11-07",
  );

  assert.deepEqual(schemes[0].listingWindows[0].links, []);
});
