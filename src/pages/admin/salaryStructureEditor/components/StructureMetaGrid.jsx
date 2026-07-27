import React from "react";
import {
  Tag, Users, Repeat, Calendar,
  Building2, Coins, Globe, MapPin, AlignLeft, CheckCircle,
} from "lucide-react";
import MetaField from "./MetaField";

const StructureMetaGrid = React.memo(function StructureMetaGrid({ structure, strCode }) {
  return (
    <div className="shrink-0 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
      <div className="grid grid-cols-4 gap-x-8 gap-y-3.5">
        <MetaField icon={<Tag size={13} />} label="Template Code" value={strCode} />
        <MetaField icon={<Users size={13} />} label="Employee Type" value="All Employees" />
        <MetaField icon={<Repeat size={13} />} label="Pay Frequency" value="Monthly" />
        <MetaField icon={<Calendar size={13} />} label="Effective From" value="01 Jan 2025" />
        <MetaField icon={<Building2 size={13} />} label="Company" value="All Companies" />
        <MetaField icon={<Coins size={13} />} label="Currency" value="INR — Indian Rupee" />
        <MetaField icon={<Globe size={13} />} label="Department" value="All Departments" />
        <MetaField icon={<MapPin size={13} />} label="Location" value="All Locations" />
        <MetaField
          icon={<CheckCircle size={13} />}
          label="Status"
          value={structure.is_default ? "Default" : "Active"}
          badge
        />
        {structure.description && (
          <div className="col-span-3 flex items-start gap-2">
            <span className="text-gray-400 mt-0.5 shrink-0"><AlignLeft size={13} /></span>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">
                Description
              </p>
              <p className="text-[12px] text-gray-600">{structure.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default StructureMetaGrid;
