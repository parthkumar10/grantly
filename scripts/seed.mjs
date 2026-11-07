// Run locally only. Writes SQL for the curated public catalog; no private keys required.
import { readFileSync, writeFileSync } from "node:fs";
const records = JSON.parse(readFileSync("data/scholarships.json", "utf8"));
writeFileSync(
  "supabase/seed.sql",
  records
    .map(
      (s) =>
        `insert into public.scholarships(id,record) values (${s.id}, '${JSON.stringify(s).replaceAll("'", "''")}'::jsonb) on conflict(id) do update set record=excluded.record,updated_at=now();`,
    )
    .join("\n"),
);
console.log(
  "Generated supabase/seed.sql. Review and run it in the Supabase SQL editor.",
);
