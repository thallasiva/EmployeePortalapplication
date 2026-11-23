import React from 'react';
const ToggleSwitch = ({
  enabled,
  onToggle
}) => {
  return <button type="button" onClick={onToggle} aria-pressed={enabled} className={`relative h-6 w-11 rounded-full transition ${enabled ? 'bg-brand' : 'bg-slate-300'}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? 'right-1' : 'left-1'}`} />
    </button>;
};
export { ToggleSwitch };
