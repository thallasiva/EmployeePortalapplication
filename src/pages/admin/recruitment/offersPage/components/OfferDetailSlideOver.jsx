import React from "react";
import { CheckCircle, XCircle, Loader2, FileDown, UserCheck, Send, Copy } from "lucide-react";
import { SlideOver, Btn, DetailRow } from "../../shared";
import CtcTableRow from "./CtcTableRow";
import { fmt, fmtM } from "../utils/ctcUtils";
import { OFFER_CLS } from "../constants";
import { downloadOfferDocx } from "../../../../../api/recruitment.api";

const OfferDetailSlideOver = React.memo(function OfferDetailSlideOver({
  detail, joiningInv, isAdmin, acting, resending,
  onClose, onRelease, onRespond, onResend, onCopyLink, onStartOnboarding
}) {
  const footer = (
    <div className="flex gap-2 flex-wrap">
      {detail.status === "Draft" && (
        <Btn icon={acting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          disabled={acting} onClick={() => onRelease(detail.offer_id)}>
          Release Offer
        </Btn>
      )}
      {(detail.status === "Released" || detail.status === "Accepted") && (
        <Btn variant="secondary" icon={<FileDown size={14} />}
          onClick={() => downloadOfferDocx(detail.offer_id, `Offer_Letter_${detail.offer_code || detail.offer_id}.docx`)}>
          Download Word
        </Btn>
      )}
      {detail.status === "Accepted" && isAdmin && (
        <Btn icon={<UserCheck size={14} />} onClick={onStartOnboarding}>
          Start Onboarding
        </Btn>
      )}
      {detail.status === "Released" && (
        <>
          <Btn icon={acting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            disabled={acting} onClick={() => onRespond(detail.offer_id, "Accepted")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Accept
          </Btn>
          <Btn variant="danger" icon={acting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            disabled={acting} onClick={() => onRespond(detail.offer_id, "Rejected")}>
            Reject
          </Btn>
        </>
      )}
      <Btn variant="secondary" onClick={onClose}>Close</Btn>
    </div>
  );

  return (
    <SlideOver open={!!detail} onClose={onClose} title="Offer Details" width={580} footer={footer}>
      <div className="space-y-1 mb-5">
        <DetailRow label="Offer Code" value={detail.offer_code || "n/a"} />
        <DetailRow label="Candidate" value={detail.candidate_name || "n/a"} />
        <DetailRow label="Designation" value={detail.designation || "n/a"} />
        <DetailRow label="Date of Joining" value={detail.date_of_joining ? detail.date_of_joining.slice(0, 10) : "n/a"} />
        <DetailRow label="Status" value={
          <span className={`px-2.5 py-[2px] rounded-full text-[11px] font-semibold ${OFFER_CLS[detail.status] ?? "bg-gray-100 text-gray-500"}`}>
            {detail.status}
          </span>
        } />
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="bg-[#1e3a5f] px-4 py-2.5 grid grid-cols-3">
          <span className="text-white text-[12px] font-semibold">Component</span>
          <span className="text-white text-[12px] font-semibold text-right pr-4">Monthly</span>
          <span className="text-white text-[12px] font-semibold text-right">Annual</span>
        </div>
        {[
          { label: "Basic Salary", v: detail.basic },
          { label: "HRA", v: detail.hra },
          { label: "Telephone Allowance", v: detail.telephone_allowance },
          { label: "Leave Travel", v: detail.leave_travel },
          { label: "Special Allowance", v: detail.special_allowance },
          { label: "Gross Salary", v: detail.gross_salary, highlight: true },
          { label: "PF Contribution", v: detail.pf_contribution },
          { label: "Statutory Bonus", v: detail.statutory_bonus },
          { label: "Gratuity", v: detail.gratuity },
          { label: "ESI", v: detail.esi },
          { label: "Total CTC", v: detail.ctc, highlight: true }
        ].map((row) => (
          <CtcTableRow key={row.label} label={row.label}
            monthly={fmtM(row.v)} annual={fmt(Number(row.v) || 0)} highlight={row.highlight} />
        ))}
      </div>

      {(detail.status === "Released" || detail.status === "Accepted") && (
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-[13px] font-semibold text-indigo-700 mb-2">Joining Invitation</p>
          {joiningInv ? (
            <div className="space-y-2">
              <p className="text-[12px] text-gray-600">
                Invitation sent. Token: <span className="font-mono text-gray-800">{joiningInv.token?.slice(0, 12)}...</span>
              </p>
              <div className="flex gap-2">
                <Btn size="sm" variant="secondary"
                  icon={resending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  disabled={resending} onClick={onResend}>Resend
                </Btn>
                <Btn size="sm" variant="secondary" icon={<Copy size={12} />} onClick={onCopyLink}>Copy Link</Btn>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-gray-500">No joining invitation sent yet.</p>
          )}
        </div>
      )}
    </SlideOver>
  );
});

export default OfferDetailSlideOver;
