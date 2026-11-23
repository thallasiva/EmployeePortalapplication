/* ─── Theme ──────────────────────────────────────────────────────────────── */
const C = {
  bg: "#0d0f1a",
  card: "#161929",
  panel: "#111422",
  border: "#252840",
  accent: "#e87500",
  teal: "#0E7C86",
  danger: "#ef4444",
  warn: "#f59e0b",
  success: "#22c55e",
  text: "#f1f5f9",
  muted: "#8892a4"
};
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const formatTime = s => `${String(Math.floor(Math.max(s, 0) / 60)).padStart(2, "0")}:${String(Math.max(s, 0) % 60).padStart(2, "0")}`;
const STAGE_LABELS = {
  introduction: "Step 1: Welcome and introduction",
  resume_validation: "Step 3: Resume-based questions",
  technical: "Step 4: Technical questions",
  follow_up: "Step 5: Follow-up questions",
  scenario: "Step 5: Real-time scenario",
  coding: "Step 6: Coding round"
};
// Default time limits per question type (seconds). Backend question.timeLimit overrides.
// Default time limits per question type (seconds). Backend question.timeLimit overrides.
const TYPE_TIME = {
  MCQ: 120,
  TEXT: 120,
  SCENARIO: 300,
  SYSTEM_DESIGN: 900,
  CODING: 600,
  CODE: 600,
  DEFAULT: 120
};
function speak(text, onEnd) {
  if (!window.speechSynthesis || !text) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-IN";
  u.rate = 0.92;
  u.onend = onEnd;
  u.onerror = onEnd;
  window.speechSynthesis.speak(u);
}
/* ─── Global CSS ─────────────────────────────────────────────────────────── */
/* ─── Global CSS ─────────────────────────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');
*{box-sizing:border-box;}
@keyframes spin     { to{transform:rotate(360deg);} }
@keyframes ripple   { 0%{transform:scale(.8);opacity:.7;} 100%{transform:scale(2.4);opacity:0;} }
@keyframes pulse    { 0%,100%{transform:scale(1);opacity:.8;} 50%{transform:scale(1.12);opacity:1;} }
@keyframes recBlink { 0%,100%{opacity:1;} 50%{opacity:0;} }
@keyframes fadeIn   { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:none;} }
@keyframes slideDown{ from{opacity:0;transform:translateY(-12px);} to{opacity:1;transform:none;} }
@keyframes shake    { 0%,100%{transform:translateX(0);} 20%,60%{transform:translateX(-6px);} 40%,80%{transform:translateX(6px);} }
@keyframes timePulse{ 0%,100%{opacity:1;} 50%{opacity:.5;} }
.ai-ring-1{animation:ripple 2.4s ease-out infinite;}
.ai-ring-2{animation:ripple 2.4s ease-out .7s infinite;}
.ai-ring-3{animation:ripple 2.4s ease-out 1.4s infinite;}
.ai-pulse {animation:pulse 2s ease-in-out infinite;}
.rec-dot  {animation:recBlink 1.2s ease-in-out infinite;}
.fade-in  {animation:fadeIn .35s ease;}
.slide-down{animation:slideDown .25s ease;}
.shake    {animation:shake .4s ease;}
.time-urgent{animation:timePulse .7s ease-in-out infinite;}
.btn-primary{background:linear-gradient(135deg,#e87500,#cf6900);color:#fff;border:none;border-radius:30px;padding:13px 28px;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s,opacity .15s;}
.btn-primary:hover{transform:scale(1.03);}
.btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none;}
.btn-ghost{background:none;border:1px solid #252840;border-radius:10px;color:#8892a4;cursor:pointer;padding:8px 14px;font-size:13px;display:flex;align-items:center;gap:6px;transition:border-color .2s,color .2s;}
.btn-ghost:hover{border-color:#e87500;color:#e87500;}
`;
/* ─── AI Avatar ──────────────────────────────────────────────────────────── */
export { C, Recognition, formatTime, STAGE_LABELS, TYPE_TIME, speak, STYLE };
