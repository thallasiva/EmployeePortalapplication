import React from "react";
import { ChevronDown } from "lucide-react";
import { COMPANIES } from "../constants";

const SettingsHeader = React.memo(function SettingsHeader({
  selectedCompany, selectedCompanyId,
  companyOpen, setCompanyOpen, selectCompany,
}) {
  return (
    <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Home / Settings</p>
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setCompanyOpen((o) => !o)}
              className="flex items-center gap-2 border border-gray-300 bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-50 shadow-sm min-w-[220px] justify-between"
            >
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-brand text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {selectedCompany.name[0]}
                </span>
                {selectedCompany.name}
              </span>
              <ChevronDown size={14} className={`transition-transform ${companyOpen ? 'rotate-180' : ''}`} />
            </button>

            {companyOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[240px] py-1">
                {COMPANIES.map((co) => (
                  <button
                    key={co.id}
                    type="button"
                    onClick={() => selectCompany(co.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 ${co.id === selectedCompanyId ? 'text-brand font-medium bg-brand-50' : 'text-slate-700'}`}
                  >
                    <span className="w-5 h-5 rounded bg-brand text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {co.name[0]}
                    </span>
                    {co.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
});

export default SettingsHeader;
