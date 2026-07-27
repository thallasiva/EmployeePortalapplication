import { memo } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Standardised page header with optional back button and action slot.
 *
 * @param {string}    title
 * @param {string}    [subtitle]
 * @param {ReactNode} [actions]   — right-aligned action buttons
 * @param {boolean}   [back]      — show back chevron (calls navigate(-1))
 * @param {string}    [className]
 */
const PageHeader = memo(function PageHeader({ title, subtitle, actions, back = false, className = "" })
{
  const navigate = useNavigate();

  return (
    <div className={`flex items-start justify-between mb-6 ${className}`}>
      <div className="flex items-start gap-2">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold text-gray-800 leading-tight">{title}</h1>
          {subtitle && <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {actions}
        </div>
      )}
    </div>
  );
});

export default PageHeader;
