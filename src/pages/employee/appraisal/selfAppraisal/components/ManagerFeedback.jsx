import React from "react";
import { UserCheck } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";
import StarDisplay from "./StarDisplay";

const ManagerFeedback = React.memo(function ManagerFeedback({ ratings, params }) {
  const reviewed = ratings.filter((r) => r.manager_rating);
  if (!reviewed.length) return null;

  const avgMgr = (
    reviewed.reduce((s, r) => s + r.manager_rating, 0) / reviewed.length
  ).toFixed(1);

  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, overflow: "hidden", marginBottom: 20,
    })}>
      <div className={cssClass({
        background: "linear-gradient(135deg,#6366f1,#4f46e5)",
        padding: "14px 18px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
      })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
          <UserCheck size={20} className={cssClass({ color: "#fff" })} />
          <div>
            <p className={cssClass({ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 })}>
              Manager's Review
            </p>
            <p className={cssClass({ fontSize: 11, opacity: 0.8, color: "#fff", margin: 0 })}>
              Your reporting manager has submitted feedback
            </p>
          </div>
        </div>
        <div className={cssClass({ textAlign: "right" })}>
          <p className={cssClass({ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 })}>
            {avgMgr}
          </p>
          <p className={cssClass({ fontSize: 10, color: "rgba(255,255,255,0.7)", margin: 0 })}>
            Overall Avg / 5
          </p>
        </div>
      </div>

      <div className={cssClass({ padding: "16px 18px" })}>
        <div className={cssClass({ display: "grid", gap: 10 })}>
          {params.map((p) => {
            const r = ratings.find((x) => x.parameter_key === p.key);
            if (!r || !r.manager_rating) return null;
            return (
              <div
                key={p.key}
                className={cssClass({
                  background: "#f8fafc", border: "1px solid #e2e8f0",
                  borderRadius: 10, padding: "12px 14px",
                })}
              >
                <p className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 8px" })}>
                  {p.label}
                </p>
                <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
                  <div>
                    <p className={cssClass({
                      fontSize: 11, fontWeight: 700, color: "#94a3b8",
                      textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 5px",
                    })}>
                      Your Rating
                    </p>
                    <StarDisplay value={r.self_rating || 0} color={BRAND} />
                    {r.self_comments && (
                      <p className={cssClass({ fontSize: 11, color: "#64748b", margin: "5px 0 0", fontStyle: "italic" })}>
                        "{r.self_comments}"
                      </p>
                    )}
                  </div>
                  <div>
                    <p className={cssClass({
                      fontSize: 11, fontWeight: 700, color: "#6366f1",
                      textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 5px",
                    })}>
                      Manager's Rating
                    </p>
                    <StarDisplay value={r.manager_rating} color="#6366f1" />
                    {r.manager_comments && (
                      <p className={cssClass({
                        fontSize: 11, color: "#4338ca", margin: "5px 0 0", fontStyle: "italic",
                        background: "#eef2ff", padding: "6px 10px", borderRadius: 6,
                      })}>
                        "{r.manager_comments}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default ManagerFeedback;
