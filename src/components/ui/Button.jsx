import { memo } from "react";
const VARIANTS = {
  primary: "border border-[#e87500] bg-[#e87500] text-white hover:bg-[#cf6900] hover:border-[#cf6900]",
  secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  danger: "border border-red-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-400",
  ghost: "border border-transparent bg-transparent text-gray-600 hover:bg-gray-100",
  success: "border border-green-500 bg-green-500 text-white hover:bg-green-600",
  outline: "border border-[#e87500] bg-transparent text-[#e87500] hover:bg-orange-50",
};
const SIZES = {
  xs: "px-2.5 py-1 text-[11px]",
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-[13px]",
  lg: "px-5 py-2.5 text-sm",
};
/**
 * Memoised, polymorphic button.
 *
 * @param {'primary'|'secondary'|'danger'|'ghost'|'success'|'outline'} [variant='primary']
 * @param {'xs'|'sm'|'md'|'lg'} [size='md']
 * @param {ReactNode} [icon]       — leading icon
 * @param {ReactNode} [iconRight]  — trailing icon
 * @param {boolean}   [loading]    — shows inline spinner, disables button
 * @param {boolean}   [fullWidth]
 */
const Button = memo(function Button({
  children,
  className = "",
  disabled = false,
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
})
{
  const isDisabled = disabled || loading;
  const isCancel = typeof children === "string" && children.trim().toLowerCase() === "cancel";
  return (
    <button
      type={type}
      disabled={isDisabled}
      data-cancel-button={isCancel || undefined}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        fullWidth ? "w-full" : "",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {loading ? (
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});
export default Button;
