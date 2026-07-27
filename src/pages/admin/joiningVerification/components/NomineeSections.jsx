import React from "react";
import { Heart, Shield, ClipboardList } from "lucide-react";
import { Sec, TblHead } from "./SharedUI";
import { fmt, parse } from "../utils";

const NomineeSections = React.memo(function NomineeSections({ detail }) {
  return (
    <>
      <Sec icon={Heart} title="Term Life Insurance Nominees">
        {parse(detail.term_life_nominees_json).length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-amber-100">
            <table className="w-full text-[12px]">
              <TblHead cols={["Name & Address", "Relationship", "DOB", "Share %", "Guardian"]} />
              <tbody>
                {parse(detail.term_life_nominees_json).map((n, i) => (
                  <tr key={i} className={"border-b border-amber-50 " + (i % 2 === 0 ? "bg-white" : "bg-amber-50/30")}>
                    <td className="px-3 py-2">{n.nomineeNameAndAddress || "—"}</td>
                    <td className="px-3 py-2">{n.relationship || "—"}</td>
                    <td className="px-3 py-2">{fmt(n.dateOfBirth)}</td>
                    <td className="px-3 py-2">{n.shareAmount || "—"}%</td>
                    <td className="px-3 py-2">{n.guardianDetails || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[12px] text-gray-400">No nominees added.</p>
        )}
      </Sec>

      <Sec icon={Shield} title="Gratuity Nominees (Form F)">
        {parse(detail.gratuity_nominees_json).length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-amber-100">
            <table className="w-full text-[12px]">
              <TblHead cols={["S.No", "Full Name & Address", "Relationship", "Age", "Share %"]} />
              <tbody>
                {parse(detail.gratuity_nominees_json).map((n, i) => (
                  <tr key={i} className={"border-b border-amber-50 " + (i % 2 === 0 ? "bg-white" : "bg-amber-50/30")}>
                    <td className="px-3 py-2 font-bold text-amber-700">{i + 1}</td>
                    <td className="px-3 py-2">{n.fullNameAndAddress || "—"}</td>
                    <td className="px-3 py-2">{n.relationship || "—"}</td>
                    <td className="px-3 py-2">{n.age || "—"}</td>
                    <td className="px-3 py-2">{n.sharePercentage || "—"}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[12px] text-gray-400">No nominees added.</p>
        )}
      </Sec>

      <Sec icon={ClipboardList} title="Group Personal Accidental Insurance Nominees">
        {parse(detail.ins_nominees_json).length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-amber-100">
            <table className="w-full text-[12px]">
              <TblHead cols={["Name & Address", "Relationship", "DOB", "Share %", "Guardian"]} />
              <tbody>
                {parse(detail.ins_nominees_json).map((n, i) => (
                  <tr key={i} className={"border-b border-amber-50 " + (i % 2 === 0 ? "bg-white" : "bg-amber-50/30")}>
                    <td className="px-3 py-2">{n.nomineeNameAndAddress || "—"}</td>
                    <td className="px-3 py-2">{n.relationship || "—"}</td>
                    <td className="px-3 py-2">{fmt(n.dateOfBirth)}</td>
                    <td className="px-3 py-2">{n.shareAmount || "—"}%</td>
                    <td className="px-3 py-2">{n.guardianDetails || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[12px] text-gray-400">No nominees added.</p>
        )}
      </Sec>
    </>
  );
});

export default NomineeSections;
