import { useState } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getHomePath, getStoredUser, persistAuthSession } from "../data/auth";
import { login as loginApi, verifyMfa } from "../api/auth.api";
import { getErrorMessage } from "../api/client";
import { errorToast } from "../utils/ToastControllers";
import PasswordInput from "../component/PasswordInput";
import bgImage from "../assets/logo.png";

/* ─── Brand colours ──────────────────────────────────────────────────── */
const C = {
  orange:     "#f18200",
  orangeDark: "#d47100",
  orangeGlow: "rgba(241,130,0,0.25)",
  navy:       "#0f1f3d",
  navyMid:    "#162848",
  navyLight:  "#1e3460",
  white:      "#ffffff",
};

/* ─── Left brand panel ────────────────────────────────────────────────── */
function BrandPanel() {
  return (
    <section
      style={{
        background: `linear-gradient(145deg, ${C.navy} 0%, ${C.navyMid} 50%, ${C.navyLight} 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
      className="flex min-h-[280px] w-full flex-col items-center justify-center px-8 py-10 text-white lg:min-h-full lg:w-[45%] lg:self-stretch"
    >
      {/* Decorative circles */}
      <span style={{
        position: "absolute", top: "-60px", right: "-60px",
        width: "220px", height: "220px", borderRadius: "50%",
        background: `radial-gradient(circle, ${C.orangeGlow} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <span style={{
        position: "absolute", bottom: "-80px", left: "-50px",
        width: "280px", height: "280px", borderRadius: "50%",
        background: `radial-gradient(circle, rgba(241,130,0,0.15) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <span style={{
        position: "absolute", top: "50%", left: "-40px", transform: "translateY(-50%)",
        width: "160px", height: "160px", borderRadius: "50%",
        border: `1px solid rgba(241,130,0,0.2)`,
        pointerEvents: "none",
      }} />
      <span style={{
        position: "absolute", bottom: "80px", right: "30px",
        width: "60px", height: "60px", borderRadius: "50%",
        border: `1px solid rgba(255,255,255,0.1)`,
        pointerEvents: "none",
      }} />
      <span style={{
        position: "absolute", top: "60px", left: "40px",
        width: "30px", height: "30px", borderRadius: "50%",
        background: `${C.orangeGlow}`,
        pointerEvents: "none",
      }} />

      {/* Logo card */}
      <div style={{
        background: C.white,
        borderRadius: "20px",
        padding: "20px 24px",
        boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "140px",
        height: "140px",
        position: "relative",
        zIndex: 10,
      }}>
        {/* Orange accent line on logo card */}
        <span style={{
          position: "absolute", bottom: 0, left: "20%", right: "20%",
          height: "3px", background: C.orange, borderRadius: "3px",
        }} />
        <img
          src={bgImage}
          alt="NAT IT Services"
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </div>

      {/* Brand text */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", marginTop: "28px" }}>
        <h1 style={{
          fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.01em",
          color: C.white, margin: 0,
        }}>
          NAT IT Services
        </h1>
        <div style={{
          width: "40px", height: "3px",
          background: `linear-gradient(90deg, ${C.orange}, ${C.orangeDark})`,
          borderRadius: "2px", margin: "12px auto",
        }} />
        <p style={{
          fontSize: "0.85rem", color: "rgba(255,255,255,0.65)",
          fontWeight: 500, margin: 0, letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          Human Resources Portal
        </p>
      </div>

      {/* Bottom tagline */}
      <div style={{
        position: "absolute", bottom: "24px", left: 0, right: 0,
        textAlign: "center", zIndex: 10,
      }}>
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
          © {new Date().getFullYear()} NAT IT Services Pvt Ltd
        </p>
      </div>
    </section>
  );
}

/* ─── Page shell ──────────────────────────────────────────────────────── */
function AuthShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, #e8edf5 0%, #d0d9e8 50%, #c8d4e6 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      {/* Subtle dot grid background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(15,31,61,0.06) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(15,31,61,0.18), 0 8px 24px rgba(15,31,61,0.1)",
          position: "relative",
          zIndex: 1,
        }}
        className="flex flex-col lg:flex-row lg:min-h-[580px]"
      >
        <BrandPanel />

        {/* Right: form panel */}
        <main
          style={{
            background: C.white,
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
          }}
        >
          <div style={{ width: "100%", maxWidth: "380px" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Styled input ─────────────────────────────────────────────────────── */
const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  fontSize: "0.9rem",
  color: "#1e293b",
  background: "#f8fafc",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

function StyledInput(props) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...(focused ? {
          borderColor: C.orange,
          boxShadow: `0 0 0 3px rgba(241,130,0,0.12)`,
          background: "#fff",
        } : {}),
      }}
      onFocus={e => { setFocused(true); props.onFocus && props.onFocus(e); }}
      onBlur={e => { setFocused(false); props.onBlur && props.onBlur(e); }}
    />
  );
}

/* ─── Label ────────────────────────────────────────────────────────────── */
function Label({ children }) {
  return (
    <label style={{
      display: "block",
      fontSize: "0.8rem",
      fontWeight: 600,
      color: "#475569",
      marginBottom: "6px",
      letterSpacing: "0.03em",
      textTransform: "uppercase",
    }}>
      {children}
    </label>
  );
}

/* ─── Error text ───────────────────────────────────────────────────────── */
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
      <span>⚠</span> {msg}
    </p>
  );
}

/* ─── Login page ───────────────────────────────────────────────────────── */
const Login = () => {
  const router = useNavigate();
  const [searchParams] = useSearchParams();
  const idleSignOut = searchParams.get("reason") === "idle";
  const existingUser = getStoredUser();

  const [mfaState, setMfaState] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  const loginForm = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email format").required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const result = await loginApi(values.email, values.password);
        if (result?.mfaRequired) {
          setMfaState({ mfaTempToken: result.mfaTempToken });
          return;
        }
        persistAuthSession(result);
        const home = getHomePath(result.user);
        if (home === "/login") {
          errorToast("Unknown role for this account");
          return;
        }
        router(home);
      } catch (err) {
        errorToast(getErrorMessage(err, "Invalid email or password"));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) { setMfaError("Please enter your 6-digit code"); return; }
    setMfaError("");
    setMfaLoading(true);
    try {
      const result = await verifyMfa(mfaState.mfaTempToken, mfaCode.trim());
      persistAuthSession(result);
      router(getHomePath(result.user));
    } catch (err) {
      setMfaError(getErrorMessage(err, "Invalid code. Try again."));
    } finally {
      setMfaLoading(false);
    }
  };

  if (existingUser) return <Navigate to={getHomePath(existingUser)} replace />;

  /* ── MFA screen ── */
  if (mfaState) {
    return (
      <AuthShell>
        {/* 2FA icon */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "14px",
            background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", fontWeight: 700, color: C.white,
            boxShadow: `0 8px 24px ${C.orangeGlow}`,
            marginBottom: "16px",
          }}>
            2FA
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
            Two-Factor Auth
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
            Enter the code from your authenticator app or a backup code.
          </p>
        </div>

        <form onSubmit={handleMfaSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <Label>Authenticator code</Label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              autoFocus
              style={{
                ...inputStyle,
                textAlign: "center",
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "0.3em",
                borderColor: mfaError ? "#ef4444" : "#e2e8f0",
              }}
              placeholder="000000"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
            />
            <FieldError msg={mfaError} />
          </div>

          <button
            type="submit"
            disabled={mfaLoading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: mfaLoading
                ? "#d1d5db"
                : `linear-gradient(135deg, ${C.orange} 0%, ${C.orangeDark} 100%)`,
              color: C.white,
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: mfaLoading ? "not-allowed" : "pointer",
              boxShadow: mfaLoading ? "none" : `0 6px 20px ${C.orangeGlow}`,
              transition: "all 0.2s",
              letterSpacing: "0.02em",
            }}
          >
            {mfaLoading ? "Verifying…" : "Verify Code"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "#64748b" }}>
          <button
            type="button"
            onClick={() => { setMfaState(null); setMfaCode(""); setMfaError(""); }}
            style={{ background: "none", border: "none", color: C.orange, fontWeight: 600, cursor: "pointer" }}
          >
            ← Back to login
          </button>
        </p>
      </AuthShell>
    );
  }

  /* ── Login screen ── */
  return (
    <AuthShell>
      {/* Heading */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontSize: "1.6rem", fontWeight: 800, color: "#0f172a",
          margin: "0 0 6px", letterSpacing: "-0.02em",
        }}>
          Welcome back
        </h2>
        <p style={{ fontSize: "0.88rem", color: "#64748b", margin: 0 }}>
          Sign in to your HR portal account
        </p>
      </div>

      {/* Idle sign-out banner */}
      {idleSignOut && (
        <div style={{
          marginBottom: "20px",
          padding: "10px 14px",
          borderRadius: "10px",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          fontSize: "0.82rem",
          color: "#92400e",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span>⏱</span>
          You were signed out due to inactivity. Please sign in again.
        </div>
      )}

      <form onSubmit={loginForm.handleSubmit} noValidate>
        {/* Email field */}
        <div style={{ marginBottom: "18px" }}>
          <Label>Email address</Label>
          <StyledInput
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={loginForm.values.email}
            onChange={loginForm.handleChange}
            onBlur={loginForm.handleBlur}
          />
          {loginForm.touched.email && <FieldError msg={loginForm.errors.email} />}
        </div>

        {/* Password field */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <Label>Password</Label>
          </div>
          <PasswordInput
            inputClassName="w-full"
            inputStyle={{
              ...inputStyle,
              display: "block",
            }}
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={loginForm.values.password}
            onChange={loginForm.handleChange}
            onBlur={loginForm.handleBlur}
          />
          {loginForm.touched.password && <FieldError msg={loginForm.errors.password} />}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loginForm.isSubmitting}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "10px",
            border: "none",
            background: loginForm.isSubmitting
              ? "#d1d5db"
              : `linear-gradient(135deg, ${C.orange} 0%, ${C.orangeDark} 100%)`,
            color: C.white,
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: loginForm.isSubmitting ? "not-allowed" : "pointer",
            boxShadow: loginForm.isSubmitting ? "none" : `0 8px 24px ${C.orangeGlow}`,
            transition: "all 0.2s",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={e => {
            if (!loginForm.isSubmitting) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 12px 32px rgba(241,130,0,0.35)`;
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = loginForm.isSubmitting ? "none" : `0 8px 24px ${C.orangeGlow}`;
          }}
        >
          {loginForm.isSubmitting ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={{
                width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "#fff", borderRadius: "50%",
                animation: "spin 0.7s linear infinite", display: "inline-block",
              }} />
              Signing in…
            </span>
          ) : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div style={{
        margin: "24px 0 16px",
        borderTop: "1px solid #f1f5f9",
        position: "relative",
        textAlign: "center",
      }}>
        <span style={{
          position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
          background: C.white, padding: "0 10px",
          fontSize: "0.75rem", color: "#94a3b8",
        }}>
          default credentials
        </span>
      </div>

      {/* Default credentials hint */}
      <div style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "10px 14px",
        textAlign: "center",
        fontSize: "0.78rem",
        color: "#64748b",
        lineHeight: "1.6",
      }}>
        <span style={{ fontWeight: 600, color: "#475569" }}>admin@yopmail.com</span>
        {" / "}
        <span style={{ fontWeight: 600, color: "#475569" }}>Admin@123</span>
        <br />
        Your dashboard shows your assigned shift automatically.
      </div>

      {/* Register link */}
      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "#64748b" }}>
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => router("/register")}
          style={{
            background: "none", border: "none",
            color: C.orange, fontWeight: 700, cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Register
        </button>
      </p>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AuthShell>
  );
};

export default Login;
