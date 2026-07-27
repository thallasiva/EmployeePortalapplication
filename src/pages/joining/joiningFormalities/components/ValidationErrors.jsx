import React from "react";

const ValidationErrors = React.memo(function ValidationErrors({ errors }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <p className="text-[13px] font-semibold text-red-700 mb-2">
        Please fix the following before continuing:
      </p>
      <ul className="list-disc list-inside space-y-1">
        {errors.map((e, i) => (
          <li key={i} className="text-[12px] text-red-600">
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default ValidationErrors;
