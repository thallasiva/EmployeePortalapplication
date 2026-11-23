function FormSection({
  title,
  description,
  children
}) {
  return <section className="border-t border-slate-100 pt-5">
      <div className="mb-4">
        <h3 className="text-[0.95rem] font-bold text-slate-800">{title}</h3>
        {description && <p className="mt-1 text-[0.78rem] text-slate-500">{description}</p>}
      </div>
      {children}
    </section>;
}
export { FormSection };
