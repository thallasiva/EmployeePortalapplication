import { baseClassName } from "./shared";
function TextInput({
  className = "",
  ...props
}) {
  return <input className={`${baseClassName} bg-white ${className}`} {...props} />;
}
export { TextInput };
