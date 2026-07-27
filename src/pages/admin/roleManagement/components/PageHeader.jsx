import React from "react";
import { ShieldCheck } from "lucide-react";

const PageHeader = React.memo(function PageHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-9 h-9 rounded-[10px] bg-[#fff7ed] flex items-center justify-center">
          <ShieldCheck size={20} color="#f18200" />
        </div>
        <div>
          <h1 className="m-0 text-[20px] font-bold text-gray-900">Role Management</h1>
          <p className="m-0 text-[12px] text-gray-400">
            Assign system roles and job designations to employees
          </p>
        </div>
      </div>
    </div>
  );
});

export default PageHeader;
