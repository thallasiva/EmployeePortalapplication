import React from 'react';
import { X } from 'lucide-react';
import { cssClass, joinClasses } from '../../../../utils/classStyles';
import { EVENT_TYPES } from '../constants/eventTypes';

const EventChip = React.memo(function EventChip({ type, label, onDelete }) {
  const cfg = EVENT_TYPES[type] || EVENT_TYPES.training;
  return (
    <div
      className={joinClasses(
        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium leading-tight cursor-default group',
        cssClass({ background: cfg.bg, color: cfg.color })
      )}
    >
      <span>{cfg.icon}</span>
      <span className="truncate max-w-[80px]">{label}</span>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 ml-auto shrink-0"
        >
          <X size={9} />
        </button>
      )}
    </div>
  );
});

export default EventChip;
