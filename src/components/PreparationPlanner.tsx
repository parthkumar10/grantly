import { deadlineLabel } from "../../lib/scholarships";
import { ArrowRight, Check, Layers } from "lucide-react";
import { preparationPlan } from "../../lib/preparation";
type Props = {
  apps: Record<number, string>;
  docs: string[];
  onReady: (document: string) => void;
  onDiscover: () => void;
};
export function PreparationPlanner({ apps, docs, onReady, onDiscover }: Props) {
  const plan = preparationPlan(apps, docs);
  const top = plan[0];
  const active = Object.values(apps).filter((s) =>
    ["Planning", "In Progress", "Preparing", "Ready to submit"].includes(s),
  ).length;
  return (
    <section className="preparation-planner" aria-labelledby="planner-title">
      <div className="planner-intro">
        <span className="eyebrow">
          <Layers size={14} /> THE PREPARATION MULTIPLIER
        </span>
        <h2 id="planner-title">One document. More doors open.</h2>
        <p>
          Prioritize the preparation that helps the most applications in your
          plan.
        </p>
      </div>
      {top ? (
        <>
          <div className="planner-recommendation">
            <div>
              <span className="planner-kicker">
                YOUR HIGHEST-IMPACT NEXT STEP
              </span>
              <h3>{top.document}</h3>
              <p>
                Needed by{" "}
                <b>
                  {top.helped.length} active{" "}
                  {top.helped.length === 1 ? "application" : "applications"}
                </b>
                .{" "}
                {top.completes > 0
                  ? `Completes the document checklist for ${top.completes}.`
                  : "A reusable step toward being ready."}
              </p>
              <button className="primary" onClick={() => onReady(top.document)}>
                <Check size={16} /> I have this document
              </button>
            </div>
            <div className="impact-number">
              <strong>{top.helped.length}</strong>
              <span>applications helped</span>
            </div>
          </div>
          <details className="planner-explanation">
            <summary>Why this step?</summary>
            <p>
              We count how many active applications need each missing document.
              Ties favor completed checklists, then the nearest verified
              deadline. No AI or award prediction is involved.
            </p>
            <ul>
              {top.helped.map((s) => (
                <li key={s.id}>
                  {s.name} <span>{deadlineLabel(s)}</span>
                </li>
              ))}
            </ul>
          </details>
          {plan.length > 1 && (
            <div className="planner-up-next">
              <span>UP NEXT</span>
              {plan.slice(1, 3).map((item) => (
                <div key={item.document}>
                  <b>{item.document}</b>
                  <small>
                    Helps {item.helped.length}{" "}
                    {item.helped.length === 1 ? "application" : "applications"}
                  </small>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="planner-complete">
          <Check size={26} />
          <h3>
            {active
              ? "Your active checklists are ready."
              : "Give your preparation a direction."}
          </h3>
          <p>
            {active
              ? "Review each application and verify its provider requirements before submitting. Document readiness does not mean an application has been submitted."
              : "Start an application plan from a scholarship to see which document to prepare first."}
          </p>
          {!active && (
            <button className="outline" onClick={onDiscover}>
              Find a scholarship <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
