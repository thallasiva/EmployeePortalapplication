import React from 'react';
function Alert({
  children,
  tone = 'red'
}) {
  return <div role="status" className={`mb-4 rounded-lg border px-4 py-3 text-sm ${tone === 'red' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-cyan-200 bg-cyan-50 text-cyan-900'}`}>{children}</div>;
}
export { Alert };
