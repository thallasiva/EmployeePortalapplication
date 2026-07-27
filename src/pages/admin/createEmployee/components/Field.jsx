import React from "react";

const Field = React.memo(function Field({ label, required, error, children }) {
  return (
    <div className="emp-field">
      <label>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      {children}
      {error && <p className="emp-field__error">{error}</p>}
    </div>
  );
});

export default Field;
