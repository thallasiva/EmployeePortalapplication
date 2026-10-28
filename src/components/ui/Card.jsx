export default function Card({ children, className = "", ...props })
{
  return <section className={`rounded-[10px] border border-gray-200 bg-white p-5 ${className}`} {...props}>{children}</section>;
}
