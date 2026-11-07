import type { StudentProfile } from "../../lib/scholarships";
export function EligibilityFields({
  profile,
  onChange,
}: {
  profile: StudentProfile;
  onChange: (p: StudentProfile) => void;
}) {
  const choices: {
    key: keyof StudentProfile;
    label: string;
    options: string[];
  }[] = [
    {
      key: "aicte",
      label: "AICTE-approved institution and technical course?",
      options: ["Yes", "No"],
    },
    {
      key: "entry",
      label: "Current entry route",
      options: ["First year", "Second year lateral", "Other"],
    },
    {
      key: "regular",
      label: "Regular course (not distance/correspondence)?",
      options: ["Yes", "No"],
    },
    {
      key: "otherAid",
      label: "Receiving another scholarship / financial assistance?",
      options: ["Yes", "No"],
    },
  ];
  const numericFields: {
    key: "percentile" | "disability" | "gapYears" | "girlsSupported";
    label: string;
    max: number;
    placeholder: string;
    help?: string;
  }[] = [
    {
      key: "percentile",
      label: "Class XII board percentile",
      max: 100,
      placeholder: "Leave blank if unknown",
      help: "PM-USP CSSS uses your board percentile, not marks percentage. If you only know your marks, leave this blank; Grantly will not guess or convert it.",
    },
    {
      key: "disability",
      label: "Certified disability percentage (optional)",
      max: 100,
      placeholder: "For example, 40",
    },
    {
      key: "gapYears",
      label: "Gap years after qualifying examination",
      max: 30,
      placeholder: "For example, 0",
    },
    {
      key: "girlsSupported",
      label: "Girls seeking Pragati support in your family",
      max: 20,
      placeholder: "For example, 1",
    },
  ];
  return (
    <>
      <div className="form-grid">
        {choices.map((f) => (
          <label key={f.key}>
            {f.label}
            <select
              value={profile[f.key]}
              onChange={(e) =>
                onChange({ ...profile, [f.key]: e.target.value })
              }
            >
              <option value="">Not provided</option>
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        ))}
        {numericFields.map((f) => (
          <div className="field-group" key={f.key}>
            <label htmlFor={"profile-" + f.key}>{f.label}</label>
            <input
              id={"profile-" + f.key}
              type="number"
              inputMode="decimal"
              min="0"
              max={f.max}
              step={f.max === 100 ? "0.01" : "1"}
              placeholder={f.placeholder}
              value={profile[f.key]}
              onChange={(e) =>
                onChange({ ...profile, [f.key]: e.target.value })
              }
            />
            {f.help && <p className="field-help">{f.help}</p>}
          </div>
        ))}
      </div>
      <p className="note">
        Leave uncertain answers blank. Grantly reports missing information
        instead of assuming eligibility. Do not enter identity or banking
        numbers.
      </p>
    </>
  );
}
