import React from "react";
import { Download, Loader2 } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
function ReportCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  children,
  onDownload,
  loading
}) {
  return <div className={cssClass({
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  })}>
      <div className={cssClass({
      display: "flex",
      alignItems: "flex-start",
      gap: 14
    })}>
        <div className={cssClass({
        width: 44,
        height: 44,
        borderRadius: 10,
        background: iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      })}>
          <Icon size={20} className={cssClass({
          color: iconColor
        })} />
        </div>
        <div className={cssClass({
        flex: 1,
        minWidth: 0
      })}>
          <p className={cssClass({
          margin: 0,
          fontSize: 14,
          fontWeight: 700,
          color: "#1e293b"
        })}>{title}</p>
          <p className={cssClass({
          margin: "3px 0 0",
          fontSize: 12,
          color: "#94a3b8"
        })}>{description}</p>
        </div>
      </div>
      {children}
      <button type="button" onClick={onDownload} disabled={loading} onMouseEnter={e => {
      if (!loading) e.currentTarget.style.opacity = "0.85";
    }} onMouseLeave={e => {
      e.currentTarget.style.opacity = "1";
    }} className={cssClass({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "9px 18px",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      cursor: loading ? "not-allowed" : "pointer",
      background: loading ? "#f1f5f9" : iconBg,
      color: loading ? "#94a3b8" : iconColor,
      border: `1px solid ${loading ? "#e2e8f0" : iconColor + "55"}`,
      transition: "all 0.15s",
      marginTop: 4
    })}>
        {loading ? <><Loader2 size={15} className={cssClass({
          animation: "spin 1s linear infinite"
        })} /> Generating…</> : <><Download size={15} /> Download</>}
      </button>
    </div>;
}
export { ReportCard };
