import { AlertTriangle } from "lucide-react";
function FieldError({
  msg
}) {
  return msg ? <p className="mt-1 flex items-center gap-1 text-[0.78rem] text-red-500"><AlertTriangle size={13} aria-hidden="true" />{msg}</p> : null;
}
export { FieldError };
