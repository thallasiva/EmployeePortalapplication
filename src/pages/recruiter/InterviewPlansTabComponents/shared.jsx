const PRIMARY = "#0E7C86";
const LIGHT = "#f0fbfc";
const BORDER = "#d1e8ea";
const STAGES = ["introduction", "resume_validation", "technical", "scenario", "domain"];
const TYPES = ["experience", "resume_probe", "technical", "practical", "scenario"];
const LEVELS = ["fundamental", "intermediate", "proficient", "advanced", "senior"];
const label = s => String(s).replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  fontSize: 13,
  background: "#fff",
  fontFamily: "inherit"
};
const btn = (variant = "primary") => ({
  padding: "8px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: variant === "ghost" ? `1px solid ${BORDER}` : "none",
  background: variant === "primary" ? PRIMARY : variant === "danger" ? "#fee2e2" : variant === "approve" ? "#059669" : "#fff",
  color: variant === "primary" || variant === "approve" ? "#fff" : variant === "danger" ? "#b91c1c" : "#374151"
});
const toEditable = q => ({
  question_text: q.question_text,
  stage: q.stage,
  question_type: q.question_type,
  skill: q.skill || "",
  difficulty: q.difficulty,
  time_limit_seconds: q.time_limit_seconds,
  points: (q.expected_points || []).join("\n")
});
const toPayload = q => ({
  question_text: q.question_text.trim(),
  stage: q.stage,
  question_type: q.question_type,
  skill: q.skill.trim() || null,
  difficulty: q.difficulty,
  time_limit_seconds: Number(q.time_limit_seconds) || 180,
  expected_points: q.points.split("\n").map(p => p.trim()).filter(Boolean)
});
export { PRIMARY, LIGHT, BORDER, STAGES, TYPES, LEVELS, label, input, btn, toEditable, toPayload };
