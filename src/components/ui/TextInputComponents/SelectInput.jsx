import { baseClassName } from "./shared";
function SelectInput({
  className = "",
  children,
  ...props
}) {
  return <select className={`${baseClassName} cursor-pointer bg-white ${className}`} {...props}>{children}</select>;
}
export { SelectInput };
