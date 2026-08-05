import React, { useState } from "react";
import { Server, Eye, EyeOff, CheckCircle2, XCircle, RefreshCw, TestTube2, Save, Mail, AlertCircle, Loader2 } from "lucide-react";
import { Btn, Input, Select, Toggle, SectionCard, Toast } from "../components/SharedUI";

const INIT = {
  host:"smtp.gmail.com", port:"587", enc:"TLS",
  senderName:"NAT IT HR Portal", senderEmail:"hr@natit.com",
  replyTo:"support@natit.com", username:"hr@natit.com", password:"",
  dailyLimit:"5000", retry:"3", timeout:"30",
  autoRetry:true, queue:true,
};

function validate(f) {
  const err = {};
  if (!f.host.trim())        err.host = "SMTP host is required";
  if (!f.port || isNaN(f.port)) err.port = "Valid port required";
  if (!f.senderEmail.includes("@")) err.senderEmail = "Valid sender email required";
  if (!f.username.trim())    err.username = "Username is required";
  return err;
}

export default function SmtpSettings() {
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [testState, setTestState] = useState("idle"); // idle | testing | success | fail
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastTested, setLastTested] = useState("05 Aug 2026, 09:45 AM");

  const set = (k, v) => { setForm(p => ({...p,[k]:v})); setErrors(p => ({...p,[k]:""})); };

  const handleTest = () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setTestState("testing");
    setTimeout(() => {
      setTestState("success");
      setLastTested(new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}));
      setToast({ message:"Test email sent successfully!", type:"success" });
    }, 2200);
  };

  const handleSave = () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToast({ message:"SMTP configuration saved!", type:"success" });
    }, 1500);
  };

  const connected = testState === "success";
  const failed    = testState === "fail";

  return (
    <div className="space-y-5">
      <Toast message={toast?.message} type={toast?.type} onClose={()=>setToast(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Form ── */}
        <div className="lg:col-span-2 space-y-5">
          <SectionCard title="SMTP Configuration" subtitle="Configure your outgoing mail server">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input label="SMTP Host" required value={form.host} onChange={e=>set("host",e.target.value)}
                  placeholder="smtp.gmail.com" error={errors.host} />
              </div>
              <Input label="SMTP Port" required value={form.port} onChange={e=>set("port",e.target.value)}
                type="number" placeholder="587" error={errors.port} />
              <Select label="Encryption" value={form.enc} onChange={e=>set("enc",e.target.value)}>
                <option>TLS</option><option>SSL</option><option>STARTTLS</option><option>None</option>
              </Select>
              <Input label="Sender Name" value={form.senderName} onChange={e=>set("senderName",e.target.value)} />
              <Input label="Sender Email" required type="email" value={form.senderEmail}
                onChange={e=>set("senderEmail",e.target.value)} error={errors.senderEmail} />
              <div className="sm:col-span-3">
                <Input label="Reply-To Email" type="email" value={form.replyTo} onChange={e=>set("replyTo",e.target.value)} />
              </div>
              <div className="sm:col-span-3"><div className="h-px bg-[#f1f5f9]" /></div>
              <Input label="SMTP Username" required value={form.username}
                onChange={e=>set("username",e.target.value)} error={errors.username} />
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#475569]">SMTP Password</label>
                <div className="relative">
                  <input type={showPass?"text":"password"} value={form.password}
                    onChange={e=>set("password",e.target.value)}
                    placeholder="Enter password"
                    className="w-full h-[40px] border border-[#e2e8f0] rounded-lg px-3 pr-10 text-[13px] text-[#1e293b] bg-white outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 transition-all" />
                  <button onClick={()=>setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]">
                    {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Delivery Settings" subtitle="Configure delivery, retry, and queue behavior">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Input label="Daily Email Limit" type="number" value={form.dailyLimit} onChange={e=>set("dailyLimit",e.target.value)} />
              <Input label="Retry Count" type="number" value={form.retry} onChange={e=>set("retry",e.target.value)} />
              <Input label="Connection Timeout (sec)" type="number" value={form.timeout} onChange={e=>set("timeout",e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key:"autoRetry", label:"Auto Retry Failed Emails", sub:"Automatically retry on delivery failure" },
                { key:"queue",     label:"Enable Email Queue",        sub:"Queue emails for batch processing" },
              ].map(item=>(
                <div key={item.key} className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-xl border border-[#e8eef5]">
                  <Toggle on={form[item.key]} onToggle={()=>set(item.key,!form[item.key])} />
                  <div>
                    <p className="text-[13px] font-semibold text-[#1e293b]">{item.label}</p>
                    <p className="text-[11px] text-[#94a3b8]">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex items-center gap-3">
            <Btn variant="primary" icon={<Save size={14}/>} onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin"/>Saving…</> : "Save Configuration"}
            </Btn>
            <Btn variant="outline" icon={<TestTube2 size={14}/>} onClick={handleTest} disabled={testState==="testing"}>
              {testState==="testing" ? <><Loader2 size={14} className="animate-spin"/>Testing…</> : "Test Connection"}
            </Btn>
          </div>
          <p className="text-[11px] text-[#94a3b8] flex items-center gap-1.5">
            <AlertCircle size={11}/> Make sure your SMTP account allows less secure app access or use an App Password.
          </p>
        </div>

        {/* ── Right: Status ── */}
        <div className="space-y-4">
          <SectionCard title="Connection Status">
            <div className="flex flex-col items-center gap-4 py-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                connected?"bg-emerald-50 border-emerald-200":failed?"bg-red-50 border-red-200":"bg-[#fff8f0] border-[#fed7aa]"}`}>
                {connected ? <CheckCircle2 size={30} color="#10b981"/> :
                 failed    ? <XCircle size={30} color="#ef4444"/> :
                 testState==="testing" ? <Loader2 size={28} color="#f18200" className="animate-spin"/> :
                             <Server size={28} color="#f18200"/>}
              </div>
              <div className="text-center">
                <p className={`text-[15px] font-bold ${connected?"text-emerald-700":failed?"text-red-600":"text-[#f18200]"}`}>
                  {connected?"Connected":failed?"Connection Failed":testState==="testing"?"Testing…":"Not Tested"}
                </p>
                {connected && <p className="text-[11px] text-[#94a3b8] mt-1">Last tested: {lastTested}</p>}
              </div>
              <Btn variant="outline" size="sm" icon={<RefreshCw size={12}/>} onClick={handleTest} disabled={testState==="testing"}>
                Test Again
              </Btn>
            </div>
            <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-[#e8eef5]">
              <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-3">Provider</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center">
                  <Mail size={16} color="#EA4335"/>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1e293b]">
                    {form.host.includes("gmail")?"Gmail SMTP":form.host.includes("outlook")?"Outlook SMTP":"Custom SMTP"}
                  </p>
                  <p className="text-[11px] text-[#94a3b8]">via {form.host || "—"}</p>
                </div>
              </div>
            </div>
            {connected && (
              <div className="mt-4 space-y-2.5">
                <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Security</p>
                {[["Authentication","Success","text-emerald-600"],["Encryption",form.enc,"text-blue-600"],["Connection","Secure","text-emerald-600"]].map(([k,v,c])=>(
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[12px] text-[#64748b]">{k}</span>
                    <span className={`text-[12px] font-bold ${c}`}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
