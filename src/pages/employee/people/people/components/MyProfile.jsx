import React from "react";
import { Mail, Phone, Calendar, MapPin, Building2, UserCheck } from "lucide-react";
import { BRAND } from "../constants";
import { fmtDate } from "../utils";
import Avatar from "./Avatar";
import SectionLabel from "./SectionLabel";
import InfoChip from "./InfoChip";

const MyProfile = React.memo(function MyProfile({ self }) {
  return (
    <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${BRAND}, #ffb347)` }}
      />
      <div className="p-5">
        <SectionLabel>My Profile</SectionLabel>
        {self ? (
          <>
            <div className="flex items-center gap-3.5 mb-[18px]">
              <Avatar name={self.name} color={self.color} size={64} />
              <div>
                <div className="text-[17px] font-extrabold text-slate-800">{self.name}</div>
                <div className="text-[13px] text-slate-500 mt-0.5">{self.jobTitle}</div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[11px] font-bold px-[9px] py-0.5 rounded-full bg-green-100 text-green-600">
                    {self.status}
                  </span>
                  <span
                    className="text-[11px] font-bold px-[9px] py-0.5 rounded-full"
                    style={{ backgroundColor: "#fff8f0", color: BRAND }}
                  >
                    {self.empCode}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoChip icon={Building2} label="Department" value={self.departmentName} />
              <InfoChip icon={MapPin} label="Location" value={self.location} />
              <InfoChip icon={Calendar} label="Joined" value={fmtDate(self.joiningDate)} />
              <InfoChip icon={Mail} label="Email" value={self.email} />
              <InfoChip icon={Phone} label="Mobile" value={self.mobile} />
              {self.bloodGroup !== "—" && (
                <InfoChip icon={UserCheck} label="Blood Group" value={self.bloodGroup} />
              )}
            </div>
          </>
        ) : (
          <div className="text-[13px] text-slate-400">Profile not available.</div>
        )}
      </div>
    </div>
  );
});

export default MyProfile;
