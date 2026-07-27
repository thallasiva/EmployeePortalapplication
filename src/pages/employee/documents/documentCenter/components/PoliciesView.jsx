import React from "react";
import { ChevronDown, ChevronRight, Search, Download } from "lucide-react";
import { PanelTitle } from "./Typography";
import JumpList from "./JumpList";
import { POLICIES } from "../constants";
import { toJumpId } from "../utils";

const PoliciesView = React.memo(function PoliciesView({
  joiningDocs, policyOpen, setPolicyOpen,
  policyDetailOpen, setPolicyDetailOpen,
  jumpToSection, handleViewPayslip, handleDownloadPayslip
}) {
  const ackMap = {
    "employee-handbook": !!joiningDocs?.handbook_acknowledged,
    "privacy": !!joiningDocs?.privacy_policy_accepted
  };

  function togglePolicyDetail(id) {
    setPolicyDetailOpen((curr) => ({ ...curr, [id]: !curr[id] }));
  }

  return (
    <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
      <PanelTitle>Company Policies</PanelTitle>
      <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
        <JumpList
          items={POLICIES.map((p) => p.jumpLabel)}
          onJump={(item) => {
            const policy = POLICIES.find((p) => p.jumpLabel === item);
            if (!policy) return;
            jumpToSection(policy.id, () => {
              setPolicyOpen((curr) => ({ ...curr, [policy.id]: true }));
              setPolicyDetailOpen((curr) => ({ ...curr, [policy.id]: true }));
            });
          }} />

        <div className="flex-1 p-2 max-h-[520px] overflow-y-auto" data-doc-scroll>
          {POLICIES.map((policy) => {
            const sectionOpen = !!policyOpen[policy.id];
            const detailOpen = !!policyDetailOpen[policy.id];
            const fileRow = { month: policy.title, text: policy.description, file: policy.file };

            return (
              <div key={policy.id} id={toJumpId(policy.id)} className="border border-[#dfe5ed] mb-2 bg-white">
                <button type="button"
                  onClick={() => setPolicyOpen((curr) => ({ ...curr, [policy.id]: !curr[policy.id] }))}
                  className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left">
                  <h4 className="text-[14px] font-semibold text-[#586377] inline-flex items-center gap-2">
                    {sectionOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {policy.title}
                    {ackMap[policy.id] &&
                      <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Acknowledged</span>
                    }
                  </h4>
                  <span className="text-[11px] text-[#a4afbf] shrink-0 ml-2">Last updated on {policy.date}</span>
                </button>

                {sectionOpen &&
                  <div className="px-3 py-2">
                    <button type="button" onClick={() => togglePolicyDetail(policy.id)} className="w-full text-left">
                      <p className="text-[13px] text-[#556176] font-semibold inline-flex items-center gap-1">
                        {detailOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        {policy.title}
                      </p>
                      <p className="text-[12px] text-[#9ca8b8] mt-1 ml-4">{policy.description}</p>
                    </button>

                    {detailOpen &&
                      <div className="mt-2 ml-4">
                        <div className="border border-[#dfe5ed] h-8 px-3 text-[12px] inline-flex items-center gap-8 bg-white">
                          <span>{policy.file}</span>
                          <span className="inline-flex gap-2 text-[#8d9aad]">
                            <button type="button" onClick={() => handleViewPayslip(fileRow)}
                              className="hover:text-[#1890ff] p-0.5" aria-label={`View ${policy.file}`} title="View policy">
                              <Search size={12} />
                            </button>
                            <button type="button" onClick={() => handleDownloadPayslip(fileRow)}
                              className="hover:text-[#1890ff] p-0.5" aria-label={`Download ${policy.file}`} title="Download policy">
                              <Download size={12} />
                            </button>
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default PoliciesView;
