function Card({ title, action, children })
{
  return (
    <section className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-3.5">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className="p-0">{children}</div>
    </section>
  );
}

export default Card;
