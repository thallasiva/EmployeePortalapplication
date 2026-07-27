import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Password input with a show/hide toggle.
 * Renders masked (dots) by default; click the eye icon to reveal.
 * Accepts the same props as a normal <input> (value, onChange, onBlur, name, className, ...).
 */
const PasswordInput = ({ className = "", inputClassName, inputStyle, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${inputClassName || ""} pr-10`}
        style={inputStyle}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
