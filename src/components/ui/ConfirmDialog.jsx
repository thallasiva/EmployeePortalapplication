import { memo } from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

const ICONS = {
  danger: { Icon: Trash2, iconClass: "text-red-500", bgClass: "bg-red-50" },
  warning: { Icon: AlertTriangle, iconClass: "text-yellow-500", bgClass: "bg-yellow-50" },
  info: { Icon: Info, iconClass: "text-blue-500", bgClass: "bg-blue-50" },
};

/**
 * Accessible confirmation dialog built on top of <Modal>.
 *
 * @param {boolean}  open
 * @param {function} onClose
 * @param {function} onConfirm
 * @param {string}   [title]
 * @param {string}   [description]
 * @param {string}   [confirmLabel]
 * @param {string}   [cancelLabel]
 * @param {'danger'|'warning'|'info'} [variant]
 * @param {boolean}  [loading]       — disables the confirm button while in-flight
 */
const ConfirmDialog = memo(function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
})
{
  const { Icon, iconClass, bgClass } = ICONS[variant] ?? ICONS.danger;
  const btnVariant = variant === "danger" ? "danger" : variant === "warning" ? "primary" : "primary";

  return (
    <Modal open={open} onClose={onClose} size="xs">
      <div className="text-center py-2">
        <div className={`w-12 h-12 rounded-full ${bgClass} flex items-center justify-center mx-auto mb-4`}>
          <Icon size={22} className={iconClass} />
        </div>
        <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed max-w-[260px] mx-auto">{description}</p>
        )}
      </div>

      <div className="flex gap-2 mt-5 justify-center">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={btnVariant} onClick={onConfirm} disabled={loading}>
          {loading ? "Please wait…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
});

export default ConfirmDialog;
