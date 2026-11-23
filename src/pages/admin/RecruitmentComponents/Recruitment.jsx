import React from "react";
import { useSearchParams } from "react-router-dom";
import { getStoredUser } from "../../../data/auth";
import { roleInfo } from ".././recruitment/data";
import { TABS } from "./shared";
import { RenderPage } from "./RenderPage";
const Recruitment = () => {
  const user = getStoredUser();
  const role = roleInfo(user);
  const roleId = role.id;
  const tabs = TABS[roleId] || TABS[5];
  const [searchParams, setSearchParams] = useSearchParams();
  const activePage = searchParams.get("page") || searchParams.get("tab") || "dashboard";
  function navigate(key) {
    setSearchParams({
      page: key
    }, {
      replace: true
    });
  }
  return <div className="font-[Inter,system-ui,sans-serif] min-h-screen bg-[#f8f9fc]">
      <nav className="
        bg-white
        border-b border-[#e5e7eb]
        px-[4px]
        flex
        gap-[2px]
        overflow-x-auto
        mb-[24px]
        shadow-[0_1px_4px_rgba(0,0,0,0.06)]
      ">
        {tabs.map(tab => {
        const Icon = tab.icon;
        const selected = activePage === tab.key;
        return <button key={tab.key} onClick={() => navigate(tab.key)} className={`
              inline-flex
              items-center
              gap-[6px]
              px-[16px]
              py-[12px]
              text-[13px]
              ${selected ? "font-[700] text-[#e87500] border-b-[2px] border-[#e87500]" : "font-[500] text-[#6b7280] border-b-[2px] border-transparent"}
              bg-transparent
              border-x-0
              border-t-0
              cursor-pointer
              whitespace-nowrap
              transition-[color,border-color]
              duration-[150ms]
            `}>
              <Icon size={15} />
              {tab.label}
            </button>;
      })}
      </nav>
      <div className="px-[4px]">
        <RenderPage page={activePage} roleId={roleId} />
      </div>
    </div>;
};
export { Recruitment };
