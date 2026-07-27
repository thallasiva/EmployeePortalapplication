import React from 'react';
import { FileText } from 'lucide-react';
import { ADMIN_LEAVE_POLICIES } from '../../../../data/adminLeaveData';

const LeavePolicySection = React.memo(function LeavePolicySection() {
  return (
    <section className="admin-dash-card">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={18} className="text-gray-600" />
        <h3 className="font-semibold text-gray-900">Leave Policy Summary</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ADMIN_LEAVE_POLICIES.map((p) => (
          <div key={p.title}>
            <p className="font-semibold text-gray-800 text-sm mb-1">{p.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{p.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
});

export default LeavePolicySection;
