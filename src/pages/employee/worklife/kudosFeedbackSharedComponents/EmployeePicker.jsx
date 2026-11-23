import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Check, Loader2, Search, X } from "lucide-react";
import { listKfEmployees } from "../../../../api/kudosFeedback.api";
import { Avatar } from "./Avatar";
const EmployeePicker = ({
  multiple = false,
  value,
  onChange,
  teamOnly = false,
  max = 25,
  preset = []
}) => {
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState([]);
  const [known, setKnown] = useState(() => Object.fromEntries(preset.map(p => [p.employee_id, p])));
  const [loading, setLoading] = useState(false);
  const selected = multiple ? value : value ? [value] : [];
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      listKfEmployees({
        search: search || undefined,
        team: teamOnly ? 1 : undefined
      }).then(rows => {
        if (!alive) return;
        setPeople(rows || []);
        setKnown(k => ({
          ...k,
          ...Object.fromEntries((rows || []).map(p => [p.employee_id, p]))
        }));
      }).catch(() => alive && setPeople([])).finally(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [search, teamOnly]);
  const toggle = id => {
    if (!multiple) return onChange(selected[0] === id ? null : id);
    if (selected.includes(id)) return onChange(selected.filter(x => x !== id));
    if (selected.length >= max) return toast.info(`You can select up to ${max} people`);
    onChange([...selected, id]);
  };
  return <div className="space-y-2">
      {selected.length > 0 && <div className="flex flex-wrap gap-1.5">
          {selected.map(id => <span key={id} className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-orange-50 text-[#b45309] text-xs font-semibold">
              {known[id]?.name || `#${id}`}
              <button type="button" aria-label={`Remove ${known[id]?.name || id}`} onClick={() => toggle(id)} className="w-5 h-5 rounded-full hover:bg-orange-100 flex items-center justify-center">
                <X size={12} />
              </button>
            </span>)}
        </div>}
      <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 h-10 focus-within:border-[#e87500]">
        <Search size={15} className="text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={teamOnly ? "Search your team" : "Search by name, code or email"} aria-label="Search employees" className="flex-1 text-sm outline-none bg-transparent" />
        {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
      </div>
      <ul className="border border-slate-100 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-50" aria-label="Employees">
        {!loading && people.length === 0 && <li className="px-3 py-4 text-sm text-slate-500 text-center">No employees found</li>}
        {people.map(p => {
        const on = selected.includes(p.employee_id);
        return <li key={p.employee_id}>
              <button type="button" onClick={() => toggle(p.employee_id)} aria-pressed={on} className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 ${on ? "bg-orange-50/60" : ""}`}>
                <Avatar name={p.name} size={32} tone={on ? "orange" : "slate"} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-800 truncate">{p.name}</span>
                  <span className="block text-xs text-slate-500 truncate">
                    {[p.designation, p.department_name].filter(Boolean).join(" · ") || p.emp_code}
                    {p.is_direct_report ? " · Your team" : ""}
                  </span>
                </span>
                {on && <Check size={16} className="text-[#e87500]" />}
              </button>
            </li>;
      })}
      </ul>
    </div>;
};
export { EmployeePicker };
