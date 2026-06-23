import { useState } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getHomePath, getStoredUser, persistAuthSession } from "../data/auth";
import { login as loginApi, verifyMfa } from "../api/auth.api";
import { getErrorMessage } from "../api/client";
import { errorToast } from "../utils/ToastControllers";
import PasswordInput from "../component/PasswordInput";

const Login = () => {
  const router = useNavigate();
  const [searchParams] = useSearchParams();
  const idleSignOut = searchParams.get("reason") === "idle";
  const existingUser = getStoredUser();

  // MFA second-step state
  const [mfaState, setMfaState] = useState(null); // { mfaTempToken }
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  // ── Step 1: Email + Password ───────────────────────────────────────────────
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
          // Admin has MFA enabled — show TOTP step
          setMfaState({ mfaTempToken: result.mfaTempToken });
          return;
        }

        persistAuthSession(result);
        const home = getHomePath(result.user);
        if (home === "/login") { errorToast("Unknown role for this account"); return; }
        router(home);
      } catch (err) {
        errorToast(getErrorMessage(err, "Invalid email or password"));
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ── Step 2: TOTP verification ──────────────────────────────────────────────
  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) { setMfaError("Please enter your 6-digit code"); return; }
    setMfaError("");
    setMfaLoading(true);
    try {
      const result = await verifyMfa(mfaState.mfaTempToken, mfaCode.trim());
      persistAuthSession(result);
      const home = getHomePath(result.user);
      router(home);
    } catch (err) {
      setMfaError(getErrorMessage(err, "Invalid code. Try again."));
    } finally {
      setMfaLoading(false);
    }
  };

  if (existingUser) return <Navigate to={getHomePath(existingUser)} replace />;

  // ── MFA step UI ────────────────────────────────────────────────────────────
  if (mfaState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-brand-50/30 to-slate-100 flex flex-col items-center justify-center font-sans px-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center text-xl font-bold shadow-lg mb-4">N</div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">NAT IT</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Human Resources Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-8 md:p-10">
          <div className="flex justify-center mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-xl font-semibold text-center text-slate-800">Two-factor authentication</h2>
          <p className="text-center text-sm text-slate-500 mb-6 mt-1">
            Enter the 6-digit code from your authenticator app, or one of your backup codes.
          </p>

          <form onSubmit={handleMfaSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Authenticator code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                className="w-full border rounded-lg px-4 py-2 text-base text-center tracking-widest text-lg input-focus-brand"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
                autoFocus
              />
              {mfaError && <p className="text-sm text-red-600 mt-1">{mfaError}</p>}
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-2.5 text-base disabled:opacity-60"
              disabled={mfaLoading}
            >
              {mfaLoading ? "Verifying..." : "Verify"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            <button
              type="button"
              className="link-brand"
              onClick={() => { setMfaState(null); setMfaCode(""); setMfaError(""); }}
            >
              ← Back to login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 1 UI ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-brand-50/30 to-slate-100 flex flex-col items-center justify-center font-sans px-4">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center text-xl font-bold shadow-lg mb-4">N</div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">NAT IT</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Human Resources Portal</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-8 md:p-10">
        <form onSubmit={loginForm.handleSubmit}>
          <h2 className="text-xl font-semibold text-center text-slate-800">Sign in</h2>
          <p className="text-center text-sm text-slate-500 mb-4 mt-1">Sign in to your account</p>

          {/* Idle session timeout banner */}
          {idleSignOut && (
            <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg text-center">
              You were signed out due to inactivity. Please sign in again.
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-4 py-2 text-base input-focus-brand"
              name="email"
              autoComplete="email"
              value={loginForm.values.email}
              onChange={loginForm.handleChange}
              onBlur={loginForm.handleBlur}
              placeholder="admin@yopmail.com"
            />
            {loginForm.touched.email && loginForm.errors.email && (
              <p className="text-sm text-red-600 mt-1">{loginForm.errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <PasswordInput
              inputClassName="w-full border rounded-lg px-4 py-2 text-base input-focus-brand"
              name="password"
              autoComplete="current-password"
              value={loginForm.values.password}
              onChange={loginForm.handleChange}
              onBlur={loginForm.handleBlur}
            />
            {loginForm.touched.password && loginForm.errors.password && (
              <p className="text-sm text-red-600 mt-1">{loginForm.errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-2.5 text-base disabled:opacity-60"
            disabled={loginForm.isSubmitting}
          >
            {loginForm.isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Default admin: admin@yopmail.com / Admin@123
          <br />
          Your dashboard automatically shows your assigned shift (General, Mid or Night).
        </p>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <button type="button" className="link-brand font-medium" onClick={() => router("/register")}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
