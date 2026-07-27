import { memo } from "react";
import { Inbox } from "lucide-react";

/**
 * Reusable empty-state illustration.
 *
 * @param {string}    title
 * @param {string}    [description]
 * @param {ReactNode} [action]        — e.g. a <Button> to create the first item
 * @param {LucideIcon} [icon]         — defaults to Inbox
 * @param {string}    [className]
 */
const EmptyState = memo(function EmptyState({ title = "No data found", description, action, icon: Icon = Inbox, className = "" })
{
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
});

export default EmptyState;
