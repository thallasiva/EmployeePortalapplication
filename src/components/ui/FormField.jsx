export default function FormField({ children, error, label, required = false })
{
  return <div className="mb-3.5">{label && <label className="mb-1 block text-[12px] font-semibold text-gray-700">{label}{required && <span className="ml-0.5 text-red-500">*</span>}</label>}{children}{error && <p className="mt-0.5 text-[11px] text-red-500">{error}</p>}</div>;
}
