import { badgeClasses } from "./data";

function Badge({ children, color = "gray" })
{
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses[color] || badgeClasses.gray}`}>{children}</span>;
}
export default Badge;
