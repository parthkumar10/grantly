# Official sources — checked 7 November 2026

The eligibility matcher currently contains five manually curated Indian
scholarship records. `data/nsp-schemes.json` separately preserves 31 scheme
names captured from the NSP All-Scholarships listing on this date. This is only
a listing inventory: it does not mean all 31 have verified rules, current
benefits, open applications, or working eligibility matching. The captured
listing is not necessarily every NSP scheme, and NSP does not cover every
state-only or other government scholarship. `npm run refresh:nsp` downloads
this public page and refreshes the names, displayed deadline text and linked
documents. This is a discovery refresh only; it does not independently verify
rules, infer deadline scope, or add entries to match scores. The app deliberately
excludes unverified entries from match scores.

| Record          | Rules / benefit source                                                     |
| --------------- | -------------------------------------------------------------------------- |
| Pragati Degree  | https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2010_G.pdf |
| Pragati Diploma | https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2011_G.pdf |
| Saksham Degree  | https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2012_G.pdf |
| Saksham Diploma | https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2013_G.pdf |
| PM-USP CSSS     | https://scholarships.gov.in/public/schemeGuidelines/FAQ_DOHE_CSSS.pdf      |

AICTE documents are July 2020 editions currently linked by NSP; CSSS uses the official 2025–26 FAQ. These editions and their limitations are disclosed in the UI.

Deadline listing: https://scholarships.gov.in/All-Scholarships

Application portal: https://scholarships.gov.in/Students

Additional government-wide discovery source:
https://www.myscheme.gov.in/. Its official FAQ describes a national platform
for Central and State/UT government schemes. It is linked for discovery, but
its content is not automatically imported into Grantly's matcher.

AICTE Saksham Diploma criteria and award duration were checked against its
July 2020 guideline and corroborated by Maharashtra DTE:
https://dte.maharashtra.gov.in/saksham-scholarship-scheme/. The eligibility
matcher uses only course level, disability threshold, income ceiling, AICTE
institution, and entry route stated in that guideline. It does not infer extra
gap-year or other-aid conditions.

The scheme list showed 30 November 2026 student deadlines for the three AICTE records. CSSS is conflicting: the list showed renewal 30 November; the student announcement showed 31 October. A fresh deadline was not confirmed. CSSS is excluded from verified reminders.

Supporting official pages inspected: https://www.myscheme.gov.in/schemes/psgs-deg ; https://dte.maharashtra.gov.in/pragati-scholarship-scheme-e/ ; https://dte.maharashtra.gov.in/saksham-scholarship-scheme/

Income certificates are specified in AICTE guidelines. Other checklist items are preparation suggestions, not a verified exhaustive upload list. Current provider requirements prevail.

Run `npm run refresh:nsp` to update `data/nsp-schemes.json` from NSP. Review
changes in the diff; a failed/short parse refuses to overwrite the inventory.
Only promote a scheme into `data/scholarships.json` after reviewing its current
primary-source rules, benefits, application route, and deadline. Preserve IDs,
record per-record source/check dates, and use null for unknown or conflicting
deadlines. Run tests and `npm run seed` after edits. There is no live ingestion
of state-only schemes; those still need a separate official source inventory.
