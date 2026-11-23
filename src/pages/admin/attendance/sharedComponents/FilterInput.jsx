import React from 'react';
function FilterInput(props) {
  return <input {...props} className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 ${props.className || ''}`} />;
}
export { FilterInput };
