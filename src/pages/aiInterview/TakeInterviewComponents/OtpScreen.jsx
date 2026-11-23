import React, { useEffect, useState } from "react";
import { CheckCircle2, Bot } from "lucide-react";
import { sendAIInterviewOtp, verifyAIInterviewOtp } from "../../../api/recruitment.api";
/* ─── Theme ──────────────────────────────────────────────────────────────── */
import { C } from "./shared";
/* ─── OTP screen ─────────────────────────────────────────────────────────── */
function OtpScreen({
  email,
  token,
  devCode,
  onVerify
}) {
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [resent, setResent] = useState(false);
  const [devHint, setDevHint] = useState(devCode || "");
  // Dev-mode convenience: when SMTP is not configured the backend returns the
  // code so local testing isn't blocked. Prefill it so it can be verified in one click.
  useEffect(() => {
    if (devCode) {
      setDevHint(devCode);
      setOtp(String(devCode).slice(0, 6));
    }
  }, [devCode]);
  async function verify() {
    if (otp.length !== 6) {
      setErr("Enter the 6-digit code");
      return;
    }
    setBusy(true);
    try {
      await verifyAIInterviewOtp(token, otp);
      onVerify();
    } catch (error) {
      setErr(error?.response?.data?.message || "Invalid verification code");
    } finally {
      setBusy(false);
    }
  }
  return <div style={{
    minHeight: "100vh",
    background: `radial-gradient(ellipse at 30% 20%,#7c3d00 0%,${C.bg} 65%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter',sans-serif"
  }}>
      <div className="fade-in" style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 22,
      padding: "40px 36px",
      width: 340,
      textAlign: "center",
      boxShadow: "0 32px 80px rgba(0,0,0,.55)"
    }}>
        <div style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: `linear-gradient(135deg,${C.accent},#cf6900)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px"
      }}><Bot size={28} color="#fff" aria-hidden="true" /></div>
        <h2 style={{
        color: C.text,
        fontSize: 22,
        fontWeight: 800,
        margin: "0 0 8px"
      }}>Verify your identity</h2>
        <p style={{
        color: C.muted,
        fontSize: 13,
        margin: "0 0 24px"
      }}>6-digit OTP sent to<br /><strong style={{
          color: C.text
        }}>{email || "your email"}</strong></p>
        <div style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        marginBottom: 18
      }}>
          {[0, 1, 2, 3, 4, 5].map(i => <input key={i} id={`otp-${i}`} maxLength={1} value={otp[i] || ""} onChange={e => {
          const v = e.target.value.replace(/\D/g, "");
          const a = otp.split("");
          a[i] = v;
          const n = a.join("").slice(0, 6);
          setOtp(n);
          setErr("");
          if (v && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
        }} onKeyDown={e => {
          if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
        }} style={{
          width: 44,
          height: 52,
          textAlign: "center",
          fontSize: 22,
          fontWeight: 700,
          background: C.panel,
          border: `1.5px solid ${err ? C.danger : otp[i] ? C.accent : C.border}`,
          borderRadius: 10,
          color: C.text,
          outline: "none"
        }} />)}
        </div>
        {devHint && <p style={{
        color: C.warn,
        fontSize: 12,
        margin: "0 0 10px",
        lineHeight: 1.4
      }}>Dev mode (email not configured): code <strong style={{
          letterSpacing: 2
        }}>{devHint}</strong> — set SMTP in .env for real delivery.</p>}
        {err && <p style={{
        color: C.danger,
        fontSize: 12,
        margin: "0 0 10px"
      }}>{err}</p>}
        <button className="btn-primary" onClick={verify} disabled={busy} style={{
        width: "100%",
        padding: "13px 0",
        fontSize: 15
      }}>{busy ? "Verifying…" : "Verify OTP"}</button>
        <button onClick={async () => {
        if (resent || busy) return;
        try {
          const r = await sendAIInterviewOtp(token);
          if (r?.devMode && r?.devCode) {
            setDevHint(r.devCode);
            setOtp(String(r.devCode).slice(0, 6));
          } else {
            setOtp("");
          }
          setResent(true);
          setErr("");
          setTimeout(() => setResent(false), 30000);
        } catch (error) {
          setErr(error?.response?.data?.message || "Could not resend code");
        }
      }} style={{
        background: "none",
        border: "none",
        color: resent ? C.muted : C.accent,
        cursor: "pointer",
        marginTop: 14,
        fontSize: 13,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4
      }}>{resent ? <><CheckCircle2 size={13} aria-hidden="true" />OTP resent</> : "Resend OTP"}</button>
      </div>
    </div>;
}
/* ─── Avya intro ─────────────────────────────────────────────────────────── */
export { OtpScreen };
