export const Row = ({
  label,
  value
}) => <div className="flex items-center justify-between py-3 border-b border-amber-50 last:border-0">
      <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">{label}</span>
      <span className="text-[13px] font-semibold text-gray-800">{value || <span className="text-gray-300 italic font-normal">—</span>}</span>
    </div>;
