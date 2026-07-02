import { statToneClasses } from "./data";

function Stat({ icon: Icon, label, value, note, tone = "brand" })
{
  const toneClass = statToneClasses[tone] || statToneClasses.brand;
  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-600 mt-1 font-medium">{label}</div>
          {note && <div className={`mt-2 text-xs font-semibold ${toneClass.note}`}>{note}</div>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${toneClass.icon} flex-shrink-0`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
export default Stat;