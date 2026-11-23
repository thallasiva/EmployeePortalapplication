function SectionCard({
  title,
  subtitle,
  children
}) {
  return <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>;
}
export { SectionCard };
