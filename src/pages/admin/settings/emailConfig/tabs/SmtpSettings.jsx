import React, { useState, useEffect, useCallback } from "react";
import { Server, Eye, EyeOff, CheckCircle2, XCircle, RefreshCw, TestTube2, Save, Mail, Loader2 } from "lucide-react";
import { Btn, Input, Select, Toggle, SectionCard, Toast } from "../components/SharedUI";
import { smtpApi } from "../../../../../api/settings.api";

const DEFAULTS = {
  host:"smtp.gmail.com", port:"587", enc:"TLS",
  senderName:"", senderEmail:"", replyTo:"",
  username:"", password:"",
  dailyLimit:"5000", retry:"3", timeout:"30",
  autoRetry:true, queue:true,
};

function validate(f) {
  const err = {};
  if (!f.host?.trim())              err.host = "SMTP host is required";
  if (!f.port || isNaN(f.port))    err.port = "Valid port required";
  if (!f.senderEmail?.includes("@")) err.senderEmail = "Valid sender email required";
  if (!f.username?.trim())          err.username = "Username is required";
  return err;
}

export default function SmtpSettings() {
  const [form, setForm] = useState(DEFAULTS);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [testState, setTestState] = useState("idle");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [lastTested, setLastTested] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* Load from API */
  useEffect(() => {
    setLoading(true);
    smtpApi.get()
      .then(data => { if (data && Object.keys(data).length) setForm(prev => ({ ...prev, ...data })); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const handleTest = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setTestState("testing");
    try {
      await smtpApi.test();
      setTestState("success");
      setLastTested(new Date().toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }));
      showToast("Test email sent successfully!");
    } catch {
      setTestState("fail");
      showToast("SMTP connection failed. Check settings.", "error");
    }
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await smtpApi.save(form);
      showToast("SMTP configuration saved!");
    } catch {
      showToast("Save failed. Please try again.", "error");
    } finally { setSaving(false); }
  };

  const connected = testState === "success";
  const failed    = testState === "fail";

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={26} className="animate-spin text-[#f18200]" />
    </div>
  );

  return (
    <div className="space-y-5">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Connection status bar */}
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[13px] font-medium ${
        connected ? "bg-green-50 border-green-200 text-green-700"
          : failed ? "bg-red-50 border-red-200 text-red-700"
          : "bg-[#fff8f0] border-[#fde6c4] text-[#b45309]"
      }`}>
        {connected ? <CheckCircle2 size={16} /> : failed ? <XCircle size={16} /> : <Server size={16} />}
        {connected ? `Connected · Last tested ${lastTested}` : failed ? "Connection failed" : lastTested ? `Last tested ${lastTested}` : "Not yet tested"}
      </div>

      <SectionCard icon={<Server size={16} color="#f18200" />} label="Server Configuration">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="SMTP Host" placeholder="smtp.gmail.com" value={form.host}
            onChange={e => set("host", e.target.value)} error={errors.host} />
          <Input label="Port" placeholder="587" value={form.port}
            onChange={e => set("port", e.target.value)} error={errors.port} />
          <Select label="Encryption" value={form.enc} onChange={e => set("enc", e.target.value)}
            options={["TLS","SSL","STARTTLS","None"]} />
        </div>
      </SectionCard>

      <SectionCard icon={<Mail size={16} color="#f18200" />} label="Sender Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Sender Name" placeholder="HR Portal" value={form.senderName}
            onChange={e => set("senderName", e.target.value)} />
          <Input label="Sender Email" placeholder="hr@company.com" value={form.senderEmail}
            onChange={e => set("senderEmail", e.target.value)} error={errors.senderEmail} />
          <Input label="Reply-To" placeholder="support@company.com" value={form.replyTo}
            onChange={e => set("replyTo", e.target.value)} />
        </div>
      </SectionCard>

      <SectionCard icon={<Server size={16} color="#f18200" />} label="Authentication">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Username" placeholder="username@company.com" value={form.username}
            onChange={e => set("username", e.target.value)} error={errors.username} />
          <div className="relative">
            <Input label="Password" type={showPass ? "text" : "password"} placeholder="••••••••"
              value={form.password} onChange={e => set("password", e.target.value)} />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-[30px] text-[#94a3b8] hover:text-[#64748b]">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={<RefreshCw size={16} color="#f18200" />} label="Delivery Settings">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input label="Daily Email Limit" value={form.dailyLimit}
            onChange={e => set("dailyLimit", e.target.value)} />
          <Input label="Retry Attempts" value={form.retry}
            onChange={e => set("retry", e.target.value)} />
          <Input label="Timeout (seconds)" value={form.timeout}
            onChange={e => set("timeout", e.target.value)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <Toggle on={form.autoRetry} onToggle={() => set("autoRetry", !form.autoRetry)} />
            <span className="text-[13px] text-[#475569]">Auto-retry failed emails</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Toggle on={form.queue} onToggle={() => set("queue", !form.queue)} />
            <span className="text-[13px] text-[#475569]">Enable email queue</span>
          </label>
        </div>
      </SectionCard>

      <div className="flex flex-wrap gap-3 justify-end pt-1">
        <Btn variant="outline" icon={<TestTube2 size={14} />} onClick={handleTest}
          disabled={testState === "testing"}>
          {testState === "testing" ? "Testing…" : "Test Connection"}
        </Btn>
        <Btn icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </Btn>
      </div>
    </div>
  );
}
