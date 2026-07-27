import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "../api/auth.api";
import { getErrorMessage } from "../api/client";
import { successToast, errorToast } from "../utils/ToastControllers";
import PasswordInput from "../component/PasswordInput";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      errorToast("Please enter your email address");
      return;
    }
    setSubmitting(true);
    try {
      const result = await forgotPassword(email.trim());
      successToast(result?.message || "If that email exists, a reset link has been sent");


      if (result?.resetToken) {
        setToken(result.resetToken);
      }
      setStep(2);
    } catch (err) {
      errorToast(getErrorMessage(err, "Could not process your request"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      errorToast("Please enter your reset token");
      return;
    }
    if (newPassword.length < 6) {
      errorToast("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      errorToast("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token.trim(), newPassword);
      successToast("Password reset successfully. Please sign in.");
      navigate("/login");
    } catch (err) {
      errorToast(getErrorMessage(err, "Could not reset your password"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-brand-50/30 to-slate-100 flex flex-col items-center justify-center font-sans px-4">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center text-xl font-bold shadow-lg mb-4">
          N
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">NAT IT</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Human Resources Portal</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-8 md:p-10">
        {step === 1 ?
        <form onSubmit={handleRequestReset}>
            <h2 className="text-xl font-semibold text-center text-slate-800">Forgot password</h2>
            <p className="text-center text-sm text-slate-500 mb-8 mt-1">
              Enter your account email and we&apos;ll send you a reset link
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
              type="email"
              className="w-full border rounded-lg px-4 py-2 text-base input-focus-brand"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com" />

            </div>

            <button
            type="submit"
            className="w-full btn-primary py-2.5 text-base disabled:opacity-60"
            disabled={submitting}>

              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form> :

        <form onSubmit={handleResetPassword}>
            <h2 className="text-xl font-semibold text-center text-slate-800">Reset password</h2>
            <p className="text-center text-sm text-slate-500 mb-8 mt-1">
              Enter the reset token from your email and choose a new password
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reset token</label>
              <input
              type="text"
              className="w-full border rounded-lg px-4 py-2 text-base input-focus-brand"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste the reset token" />

            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <PasswordInput
              inputClassName="w-full border rounded-lg px-4 py-2 text-base input-focus-brand"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} />

            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <PasswordInput
              inputClassName="w-full border rounded-lg px-4 py-2 text-base input-focus-brand"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} />

            </div>

            <button
            type="submit"
            className="w-full btn-primary py-2.5 text-base disabled:opacity-60"
            disabled={submitting}>

              {submitting ? "Resetting..." : "Reset password"}
            </button>
          </form>
        }

        <p className="text-center text-sm text-gray-500 mt-6">
          <button type="button" className="link-brand font-medium" onClick={() => navigate("/login")}>
            Back to login
          </button>
        </p>
      </div>
    </div>);

};

export default ForgotPassword;
