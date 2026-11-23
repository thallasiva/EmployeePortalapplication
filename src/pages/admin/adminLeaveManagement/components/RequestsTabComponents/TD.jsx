import { cssClass } from "../../../../../utils/classStyles";
const TD = ({
  children,
  right
}) => <td className={cssClass({
  padding: "11px 14px",
  fontSize: 13,
  color: "#374151",
  borderBottom: "1px solid #f5f5f5",
  textAlign: right ? "right" : "left",
  verticalAlign: "middle"
})}>
    {children}
  </td>;
export { TD };
