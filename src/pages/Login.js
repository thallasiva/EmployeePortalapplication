import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getHomePath, getStoredUser, persistAuthSession } from "../data/auth";
import { login as loginApi, verifyMfa } from "../api/auth.api";
import { getErrorMessage } from "../api/client";
import { apiErrorToast, errorToast } from "../utils/ToastControllers";
import PasswordInput from "../component/PasswordInput";
import logo from "../assets/logo.png";

const inputClassName =
  "w-full rounded-[10px] border-[1.5px] border-slate-200 bg-slate-50 px-3.5 py-[11px] text-[0.9rem] text-slate-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10";

function BrandPanel() {
  return (
    <section className="relative flex min-h-[280px] w-full flex-col items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#0f1f3d_0%,#162848_50%,#1e3460_100%)] px-8 py-10 text-white lg:min-h-full lg:w-[45%] lg:self-stretch">
      <span aria-hidden="true" className="pointer-events-none absolute -right-[60px] -top-[60px] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(241,130,0,0.25)_0%,transparent_70%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-[50px] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(241,130,0,0.15)_0%,transparent_70%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-orange-500/20" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-20 right-[30px] h-[60px] w-[60px] rounded-full border border-white/10" />
      <span aria-hidden="true" className="pointer-events-none absolute left-10 top-[60px] h-[30px] w-[30px] rounded-full bg-orange-500/25" />

      <div className="relative z-10 flex h-[140px] w-[140px] items-center justify-center rounded-[20px] bg-white px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]">
        <span aria-hidden="true" className="absolute bottom-0 left-1/5 right-1/5 h-[3px] rounded bg-orange-500" />
        <img src={logo} alt="NAT IT Services" className="max-h-full max-w-full object-contain" />
      </div>

      <div className="relative z-10 mt-7 text-center">
        <h1 className="m-0 text-[1.75rem] font-bold tracking-[-0.01em] text-white">NAT IT Services</h1>
        <div className="mx-auto my-3 h-[3px] w-10 rounded bg-gradient-to-r from-orange-500 to-orange-700" />
        <p className="m-0 text-[0.85rem] font-medium uppercase tracking-[0.05em] text-white/65">Human Resources Portal</p>
      </div>

      <p className="absolute bottom-6 left-0 right-0 z-10 m-0 text-center text-[0.72rem] text-white/35">
        © {new Date().getFullYear()} NAT IT Services Pvt Ltd
      </p>
    </section>
  );
}

function AuthShell({ children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#e8edf5_0%,#d0d9e8_50%,#c8d4e6_100%)] px-4 py-6">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(15,31,61,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="relative z-10 flex w-full max-w-[900px] flex-col overflow-hidden rounded-3xl shadow-[0_32px_80px_rgba(15,31,61,0.18),0_8px_24px_rgba(15,31,61,0.1)] lg:min-h-[580px] lg:flex-row">
        <BrandPanel />
        <main className="flex flex-1 items-center justify-center bg-white px-8 py-10">
          <div className="w-full max-w-[380px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function StyledInput({ className = "", ...props }) {
  return <input {...props} className={`${inputClassName} ${className}`} />;
}

function Label({ children }) {
  return <label className="mb-1.5 block text-[0.8rem] font-semibold uppercase tracking-[0.03em] text-slate-600">{children}</label>;
}

function FieldError({ msg }) {
  return msg ? <p className="mt-1 flex items-center gap-1 text-[0.78rem] text-red-500"><span>⚠</span>{msg}</p> : null;
}

const submitButtonClassName = "w-full rounded-[10px] bg-gradient-to-br from-orange-500 to-orange-700 px-3 py-3 text-[0.95rem] font-bold tracking-[0.02em] text-white shadow-[0_6px_20px_rgba(241,130,0,0.25)] transition hover:-translate-y-px hover:shadow-[0_12px_32px_rgba(241,130,0,0.35)] disabled:cursor-not-allowed disabled:bg-none disabled:bg-gray-300 disabled:shadow-none";

const Login = () => {
  const router = useNavigate();
  const [searchParams] = useSearchParams();
  const [mfaState, setMfaState] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const idleSignOut = searchParams.get("reason") === "idle";
  const existingUser = getStoredUser();

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
        apiErrorToast(err, "Invalid email or password");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleMfaSubmit = async (event) => {
    event.preventDefault();
    if (!mfaCode.trim()) {
      setMfaError("Please enter your 6-digit code");
      return;
    }
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

  if (mfaState) {
    return (
      <AuthShell>
        <div className="mb-7 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-gradient-to-br from-orange-500 to-orange-700 text-[1.1rem] font-bold text-white shadow-[0_8px_24px_rgba(241,130,0,0.25)]">2FA</div>
          <h2 className="mb-1.5 text-[1.3rem] font-bold text-slate-900">Two-Factor Auth</h2>
          <p className="text-[0.85rem] text-slate-500">Enter the code from your authenticator app or a backup code.</p>
        </div>
        <form onSubmit={handleMfaSubmit}>
          <div className="mb-5">
            <Label>Authenticator code</Label>
            <StyledInput type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={10} autoFocus className={`text-center text-2xl font-bold tracking-[0.3em] ${mfaError ? "border-red-500" : ""}`} placeholder="000000" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/[^0-9A-Za-z]/g, ""))} />
            <FieldError msg={mfaError} />
          </div>
          <button type="submit" disabled={mfaLoading} className={submitButtonClassName}>{mfaLoading ? "Verifying…" : "Verify Code"}</button>
        </form>
        <p className="mt-5 text-center text-[0.85rem] text-slate-500">
          <button type="button" onClick={() => { setMfaState(null); setMfaCode(""); setMfaError(""); }} className="font-semibold text-orange-500 hover:text-orange-700">← Back to login</button>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mb-8">
        <h2 className="mb-1.5 text-[1.6rem] font-extrabold tracking-[-0.02em] text-slate-900">Welcome back</h2>
        <p className="text-[0.88rem] text-slate-500">Sign in to your HR portal account</p>
      </div>
      {idleSignOut && <div className="mb-5 flex items-center gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[0.82rem] text-amber-900"><span>⏱</span>You were signed out due to inactivity. Please sign in again.</div>}
      <form onSubmit={loginForm.handleSubmit} noValidate>
        <div className="mb-[18px]">
          <Label>Email address</Label>
          <StyledInput type="email" name="email" autoComplete="email" placeholder="you@example.com" value={loginForm.values.email} onChange={loginForm.handleChange} onBlur={loginForm.handleBlur} />
          {loginForm.touched.email && <FieldError msg={loginForm.errors.email} />}
        </div>
        <div className="mb-6">
          <Label>Password</Label>
          <PasswordInput inputClassName={inputClassName} name="password" autoComplete="current-password" placeholder="••••••••" value={loginForm.values.password} onChange={loginForm.handleChange} onBlur={loginForm.handleBlur} />
          {loginForm.touched.password && <FieldError msg={loginForm.errors.password} />}
        </div>
        <button type="submit" disabled={loginForm.isSubmitting} className={submitButtonClassName}>
          {loginForm.isSubmitting ? <span className="flex items-center justify-center gap-2"><span aria-hidden="true" className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Signing in…</span> : "Sign In"}
        </button>
      </form>
      <div className="relative my-6 border-t border-slate-100 text-center"><span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-2.5 text-xs text-slate-400">default credentials</span></div>
      <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-center text-[0.78rem] leading-relaxed text-slate-500"><span className="font-semibold text-slate-600">admin@yopmail.com</span>{" / "}<span className="font-semibold text-slate-600">Admin@123</span><br />Your dashboard shows your assigned shift automatically.</div>
      <p className="mt-5 text-center text-[0.85rem] text-slate-500">Don&apos;t have an account? <button type="button" onClick={() => router("/register")} className="font-bold text-orange-500 hover:text-orange-700">Register</button></p>
    </AuthShell>
  );
};

export default Login;
