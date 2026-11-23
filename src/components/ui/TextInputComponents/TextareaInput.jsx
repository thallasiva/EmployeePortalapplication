import { baseClassName } from "./shared";
function TextareaInput({
  className = "",
  ...props
}) {
  return <textarea className={`${baseClassName} resize-y bg-white leading-relaxed ${className}`} {...props} />;
}
export { TextareaInput };
