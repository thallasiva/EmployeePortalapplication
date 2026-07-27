import { useState, useEffect } from "react";
import { setupMfa, enableMfa, disableMfa, getMfaStatus } from "../../api/auth.api";
import { getErrorMessage } from "../../api/client";









const MfaSetup = () => {
  const [status, setStatus] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("status");

  useEffect(() => {
    getMfaStatus().
    then((d) => setStatus(d.mfaEnabled)).
    catch(() => setStatus(false));
  }, []);

  const handleStartSetup = async () => {
    setLoading(true);setError("");
    try {
      const data = await setupMfa();
      setQrData(data);
      setStep("scan");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    if (!code.trim()) {setError("Enter the 6-digit code from your app");return;}
    setLoading(true);setError("");
    try {
      const data = await enableMfa(code.trim());
      setBackupCodes(data.backupCodes);
      setStatus(true);
      setStep("done");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid code"));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    if (!code.trim()) {setError("Enter your current TOTP code to confirm");return;}
    setLoading(true);setError("");
    try {
      await disableMfa(code.trim());
      setStatus(false);
      setStep("status");
      setCode("");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid code"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">Two-factor authentication (MFA)</h1>
      <p className="text-sm text-slate-500 mb-6">
        Protect your admin account with a TOTP authenticator app (Google Authenticator, Authy, etc.).
      </p>

      {}
      {status !== null &&
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 ${
      status ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`
      }>
          <span className={`w-2 h-2 rounded-full ${status ? "bg-green-500" : "bg-yellow-500"}`} />
          {status ? "MFA is enabled" : "MFA is not enabled"}
        </div>
      }

      {error &&
      <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      }

      {}
      {step === "status" && !status &&
      <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-4">
            Without MFA, your account is protected by password alone. Enabling MFA adds a second layer
            that is required at every login — critical because admins can view encrypted salary data.
          </p>
          <button
          className="btn-primary px-6 py-2 disabled:opacity-60"
          onClick={handleStartSetup}
          disabled={loading}>

            {loading ? "Loading..." : "Set up MFA"}
          </button>
        </div>
      }

      {}
      {step === "scan" && qrData &&
      <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-4">
            <strong>Step 1:</strong> Scan this QR code with your authenticator app.
          </p>
          <div className="flex justify-center mb-4">
            <img src={qrData.qrDataUrl} alt="TOTP QR code" className="w-48 h-48 border rounded-lg p-2" />
          </div>
          <p className="text-xs text-slate-400 text-center mb-4">
            Can&apos;t scan?{" "}
            <span className="font-mono break-all">{qrData.otpauthUrl}</span>
          </p>
          <button className="btn-primary w-full py-2" onClick={() => {setStep("confirm");setError("");}}>
            I&apos;ve scanned it →
          </button>
        </div>
      }

      {}
      {step === "confirm" &&
      <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-4">
            <strong>Step 2:</strong> Enter the 6-digit code shown in your authenticator app to confirm setup.
          </p>
          <form onSubmit={handleEnable}>
            <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="w-full border rounded-lg px-4 py-2 text-center tracking-widest text-xl mb-3 focus:outline-none focus:ring-2 focus:ring-brand"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus />

            <button type="submit" className="btn-primary w-full py-2 disabled:opacity-60" disabled={loading}>
              {loading ? "Enabling..." : "Enable MFA"}
            </button>
          </form>
        </div>
      }

      {}
      {step === "done" && backupCodes &&
      <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-lg">✓</span>
            <span className="font-semibold text-green-700">MFA enabled successfully</span>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            <strong>Save these backup codes now.</strong> Each can be used once if you lose access to your authenticator app.
            They will not be shown again.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((c) =>
          <code key={c} className="bg-slate-100 rounded px-3 py-1 text-sm font-mono text-slate-700 text-center">{c}</code>
          )}
          </div>
          <button className="btn-primary px-6 py-2" onClick={() => {setStep("status");setBackupCodes(null);}}>
            Done
          </button>
        </div>
      }

      {}
      {step === "status" && status &&
      <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-4">
            MFA is active on your account. To disable it, enter your current TOTP code below.
          </p>
          {step === "status" &&
        <button
          className="text-sm text-red-600 underline"
          onClick={() => {setStep("disable");setError("");setCode("");}}>

              Disable MFA
            </button>
        }
        </div>
      }

      {step === "disable" &&
      <div className="bg-white border border-red-200 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-4">
            Enter your current TOTP code to confirm you want to disable MFA.
          </p>
          <form onSubmit={handleDisable}>
            <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="w-full border rounded-lg px-4 py-2 text-center tracking-widest text-xl mb-3 focus:outline-none"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus />

            <div className="flex gap-3">
              <button type="submit" className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-60" disabled={loading}>
                {loading ? "Disabling..." : "Disable MFA"}
              </button>
              <button type="button" className="text-sm text-slate-500 underline" onClick={() => {setStep("status");setError("");}}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      }
    </div>);

};

export default MfaSetup;
