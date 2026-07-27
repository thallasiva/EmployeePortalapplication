import React from "react";

export const Card = React.memo(function Card({ children, style = {}, className = "" }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-[10px] p-5 ${className}`} style={style}>
      {children}
    </div>
  );
});
