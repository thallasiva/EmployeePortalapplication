import React, { useState } from "react";
import { Save, RotateCcw, Info, Lock } from "lucide-react";
import { Btn, Toast } from "../components/SharedUI";
import { ROLES, PERM_MODULES, DEFAULT_PERMS } from "../constants";

const PERM_TYPES = ["Send Email","Receive Email","Configure Templates"];

export default function EmailPermissions() {
  // perms[moduleIdx][roleIdx][permTypeIdx]
  const [perms, setPerms] = useState(() =>
    DEFAULT_PERMS.map(row =>
      ROLES.map((_, ri) => PERM_TYPES.map((_, pi) => {
        if (pi === 0) return row[ri];
        if (pi === 1) return ri <= 5;
        return ri === 0; // only Super Admin can configure templates by default
      }))
    )
  );
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const toggle = (mi, ri, pi) => {
    setPerms(prev => {
      const next = prev.map(m => m.map(r => [...r]));
      next[mi][ri][pi] = !next[mi][ri][pi];
      return next;
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToast({ message: "Permissions saved successfully!", type: "success" });
    }, 1200);
  };

  const handleReset = () => {
    setPerms(
      DEFAULT_PERMS.map(row =>
        ROLES.map((_, ri) => PERM_TYPES.map((_, pi) => {
          if (pi === 0) return row[ri];
          if (pi === 1) return ri <= 5;
          return ri === 0;
        }))
      )
    );
    setToast({ message: "Reset to default.", type: "info" });
  };

  // Role header colors
  const ROLE_COLORS = ["#f18200","#6366f1","#8b5cf6","#10b981","#3b82f6","#64748b"];

  return (
    <>
      <Toast message={toast?.message} type={toast?.type} onClose={()=>setToast(null)}/>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e8eef5] flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[14px] font-bold text-[#1e293b]">Role Based Email Permissions</p>
            <p className="text-[12px] text-[#94a3b8] mt-0.5">Control which roles can send, receive and configure emails per module</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] bg-[#f8fafc] px-3 py-2 rounded-lg border border-[#e8eef5]">
            <Info size={12}/> Click checkboxes to toggle permissions
          </div>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-b border-[#e8eef5] flex flex-wrap gap-4">
          {PERM_TYPES.map((pt, i) => (
            <div key={pt} className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
              <div className={`w-3 h-3 rounded ${i===0?"bg-[#f18200]":i===1?"bg-[#6366f1]":"bg-[#10b981]"}`}/>
              {pt}
            </div>
          ))}
        </div>

        {/* Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e8eef5]">
                <th className="text-left px-5 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider min-w-[220px] sticky left-0 bg-[#f8fafc] z-10">
                  Module
                </th>
                {ROLES.map((role, ri) => (
                  <th key={role} className="px-3 py-3 text-center min-w-[130px]">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{color: ROLE_COLORS[ri]}}>{role}</span>
                    <div className="flex justify-center gap-2 mt-1.5">
                      {PERM_TYPES.map((pt, pi) => (
                        <span key={pi} title={pt}
                          className="text-[8px] px-1 py-px rounded font-bold text-white"
                          style={{background: pi===0?"#f18200":pi===1?"#6366f1":"#10b981"}}>
                          {pt.split(" ")[0][0]}{pt.split(" ")[1]?.[0]||""}
                        </span>
                      ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERM_MODULES.map((mod, mi) => (
                <tr key={mod.name} className="border-b border-[#f8fafc] hover:bg-[#fafbff] transition-colors">
                  <td className="px-5 py-3 sticky left-0 bg-white hover:bg-[#fafbff]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#fff8f0] flex items-center justify-center shrink-0">
                        <Lock size={12} color="#f18200"/>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#1e293b]">{mod.name}</p>
                        <p className="text-[11px] text-[#94a3b8]">{mod.desc}</p>
                      </div>
                    </div>
                  </td>
                  {ROLES.map((_, ri) => (
                    <td key={ri} className="px-3 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        {PERM_TYPES.map((_, pi) => (
                          <label key={pi} title={PERM_TYPES[pi]} className="cursor-pointer">
                            <input type="checkbox"
                              checked={perms[mi][ri][pi]}
                              onChange={() => toggle(mi, ri, pi)}
                              style={{accentColor: pi===0?"#f18200":pi===1?"#6366f1":"#10b981"}}
                              className="w-[14px] h-[14px] rounded cursor-pointer"
                            />
                          </label>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e8eef5] flex items-center gap-3">
          <Btn variant="primary" icon={<Save size={14}/>} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Permissions"}
          </Btn>
          <Btn variant="outline" icon={<RotateCcw size={14}/>} onClick={handleReset}>
            Reset to Default
          </Btn>
        </div>
      </div>
    </>
  );
}
