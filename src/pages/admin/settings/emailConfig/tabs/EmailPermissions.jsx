import React, { useState, useEffect, useCallback } from "react";
import { Save, RotateCcw, Loader2, Lock } from "lucide-react";
import { emailPermissionsApi } from "../../../../../api/settings.api";
import { Btn, Toast } from "../components/SharedUI";

const ROLES = ["Super Admin","HR Manager","Manager","Employee","Recruiter","Finance"];
const MODULES = ["Leave","Attendance","Payroll","Recruitment","Onboarding","Performance","Helpdesk","Announcements"];
const PERM_TYPES = ["Send Email","Receive Email","Configure Templates"];

const buildDefault = () =>
  MODULES.map(() =>
    ROLES.map((_, ri) => PERM_TYPES.map((_, pi) => {
      if (pi === 0) return ri <= 2;         // Send: Admin, HR, Manager
      if (pi === 1) return ri <= 5;         // Receive: all
      return ri === 0;                      // Configure: only Admin
    }))
  );

export default function EmailPermissions() {
  const [perms, setPerms] = useState(buildDefault);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await emailPermissionsApi.get();
      if (data && Object.keys(data).length > 0) {
        // Rebuild matrix from stored JSON {moduleName: {roleName: {permType: bool}}}
        const matrix = MODULES.map(mod =>
          ROLES.map(role =>
            PERM_TYPES.map(pt => data?.[mod]?.[role]?.[pt] ?? false)
          )
        );
        setPerms(matrix);
      }
    } catch { /* use defaults */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (mi, ri, pi) => {
    setPerms(prev => {
      const next = prev.map(m => m.map(r => [...r]));
      next[mi][ri][pi] = !next[mi][ri][pi];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert matrix → {moduleName: {roleName: {permType: bool}}}
      const payload = {};
      MODULES.forEach((mod, mi) => {
        payload[mod] = {};
        ROLES.forEach((role, ri) => {
          payload[mod][role] = {};
          PERM_TYPES.forEach((pt, pi) => { payload[mod][role][pt] = perms[mi][ri][pi]; });
        });
      });
      await emailPermissionsApi.save(payload);
      showToast("Permissions saved!");
    } catch { showToast("Save failed", "error"); }
    finally { setSaving(false); }
  };

  const handleReset = () => { setPerms(buildDefault()); showToast("Reset to defaults", "info"); };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={24} className="animate-spin text-[#f18200]" />
    </div>
  );

  return (
    <div className="space-y-5">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="bg-white rounded-xl border border-[#f1f5f9] overflow-x-auto">
        <table className="w-full text-[12px] min-w-[700px]">
          <thead className="bg-[#f8fafc] border-b border-[#f1f5f9]">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-wide w-32">Module</th>
              {ROLES.map(role => (
                <th key={role} className="px-2 py-3 text-center text-[10px] font-bold text-[#64748b] uppercase tracking-wide">
                  <div>{role}</div>
                  <div className="flex justify-center gap-2 mt-1">
                    {PERM_TYPES.map(pt => (
                      <span key={pt} className="text-[9px] text-[#94a3b8]">{pt.split(" ")[0]}</span>
                    ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f8fafc]">
            {MODULES.map((mod, mi) => (
              <tr key={mod} className="hover:bg-[#fafafa]">
                <td className="px-4 py-3 font-semibold text-[#1e293b]">{mod}</td>
                {ROLES.map((_, ri) => (
                  <td key={ri} className="px-2 py-3">
                    <div className="flex justify-center gap-2">
                      {PERM_TYPES.map((_, pi) => (
                        <button key={pi} onClick={() => toggle(mi, ri, pi)}
                          className={`w-5 h-5 rounded border-2 transition-colors ${
                            perms[mi][ri][pi]
                              ? "bg-[#f18200] border-[#f18200]"
                              : "bg-white border-[#cbd5e1] hover:border-[#f18200]"
                          }`}>
                          {perms[mi][ri][pi] && (
                            <svg viewBox="0 0 10 8" fill="none" className="w-3 h-3 mx-auto">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-[12px] text-[#64748b] bg-[#f8fafc] rounded-xl p-3">
        <Lock size={13} className="text-[#94a3b8]" />
        {PERM_TYPES.map((pt, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="font-bold text-[#f18200]">Col {i+1}:</span>{pt}
          </span>
        ))}
      </div>

      <div className="flex gap-3 justify-end">
        <Btn variant="outline" icon={<RotateCcw size={13} />} onClick={handleReset}>Reset</Btn>
        <Btn icon={saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Permissions"}
        </Btn>
      </div>
    </div>
  );
}
