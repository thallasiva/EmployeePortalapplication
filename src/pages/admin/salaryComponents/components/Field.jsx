import React from "react";

const Field = React.memo(function Field({ label, children, half }) {
  return (
    <div className={half ? "" : "col-span-2"}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
});

export default Field;
