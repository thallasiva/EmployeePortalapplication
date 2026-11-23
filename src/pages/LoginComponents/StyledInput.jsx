import { inputClassName } from "./shared";
function StyledInput({
  className = "",
  ...props
}) {
  return <input {...props} className={`${inputClassName} ${className}`} />;
}
export { StyledInput };
