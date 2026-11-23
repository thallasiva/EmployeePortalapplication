import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { TH } from "../../constants";
const ColHead = React.memo(function ColHead({
  fiscalMonths
}) {
  return <thead>
      <tr>
        <th className={cssClass({
        ...TH,
        textAlign: "left",
        position: "sticky",
        left: 0,
        zIndex: 2,
        minWidth: 160,
        borderRight: "1px solid #d5dbe3"
      })}>Items</th>
        <th className={cssClass({
        ...TH,
        textAlign: "right",
        position: "sticky",
        left: 160,
        zIndex: 2,
        minWidth: 110,
        borderRight: "1px solid #d5dbe3"
      })}>Total</th>
        {fiscalMonths.map(c => <th key={c.key} className={cssClass({
        ...TH,
        textAlign: "right",
        minWidth: 90
      })}>{c.label}</th>)}
      </tr>
    </thead>;
});
export { ColHead };
