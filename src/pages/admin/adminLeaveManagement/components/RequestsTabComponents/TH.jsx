import { cssClass } from "../../../../../utils/classStyles";
const TH = ({
  children,
  right
}) => <th className={cssClass({
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: 11,
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: ".06em",
  textAlign: right ? "right" : "left",
  borderBottom: "1px solid #e9eaec",
  whiteSpace: "nowrap",
  background: "#fafafa"
})}>
    {children}
  </th>;
export { TH };
