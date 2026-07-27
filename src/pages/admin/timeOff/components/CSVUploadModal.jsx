import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { importHolidays } from "../../../../api/holiday.api";
import { cssClass } from "../../../../utils/classStyles";
import { B } from "../constants";
import { downloadTemplate, parseCSVText } from "../utils/csvUtils";
import Btn from "./Btn";
import CSVPreviewTable from "./CSVPreviewTable";

const COLUMNS = [
  { col: "holiday_name",  note: "required" },
  { col: "holiday_date",  note: "YYYY-MM-DD, required" },
  { col: "shift",         note: "general / mid / night" },
  { col: "location",      note: "optional" },
  { col: "is_restricted", note: "0 or 1" },
];

const CSVUploadModal = React.memo(({ onClose, onImported }) => {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseCSVText(ev.target.result);
      if (result.error) { setError(result.error); setPreview(null); }
      else { setError(""); setPreview(result.rows); }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview?.length) return;
    setLoading(true);
    try {
      const result = await importHolidays(preview);
      onImported(result.imported || preview.length);
    } catch (e) { setError(e.message); setLoading(false); }
  };

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 16, padding: 28, width: 580,
        maxHeight: "85vh", overflow: "auto", boxShadow: "0 12px 48px #0003" })}>

        {/* title */}
        <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 })}>
          <div className={cssClass({ fontSize: 17, fontWeight: 800, color: "#111827" })}>
            Bulk Upload Holidays via CSV
          </div>
          <Btn variant="cancel" size="sm" onClick={onClose}>✕</Btn>
        </div>

        {/* download template banner */}
        <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 10,
          padding: "10px 14px", marginBottom: 18 })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
            <span className={cssClass({ fontSize: 18 })}>📥</span>
            <div>
              <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#92400e" })}>Not sure about the format?</div>
              <div className={cssClass({ fontSize: 11, color: "#b45309" })}>Download the template and fill it in</div>
            </div>
          </div>
          <button type="button" onClick={downloadTemplate}
            className={cssClass({ display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: B, color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" })}>
            ⬇ Download Template
          </button>
        </div>

        {/* column reference */}
        <div className={cssClass({ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8,
          padding: "10px 14px", marginBottom: 16 })}>
          <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6,
            textTransform: "uppercase", letterSpacing: ".05em" })}>CSV Columns</div>
          <div className={cssClass({ display: "flex", gap: 6, flexWrap: "wrap" })}>
            {COLUMNS.map((c) => (
              <span key={c.col} className={cssClass({ fontSize: 11, background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 5, padding: "2px 8px", color: "#374151" })}>
                <strong>{c.col}</strong> <span className={cssClass({ color: "#9ca3af" })}>({c.note})</span>
              </span>
            ))}
          </div>
        </div>

        {/* drop zone */}
        <div onClick={() => fileRef.current.click()}
          className={cssClass({ border: `2px dashed ${preview ? B : "#d1d5db"}`,
            borderRadius: 10, padding: "28px 20px", textAlign: "center", cursor: "pointer",
            background: preview ? "#fff8f0" : "#fafafa", marginBottom: 16, transition: "all .2s" })}>
          <Upload size={28} className={cssClass({ color: preview ? B : "#9ca3af", margin: "0 auto 10px", display: "block" })} />
          <div className={cssClass({ fontSize: 13, fontWeight: 600, color: preview ? B : "#374151" })}>
            {preview ? `✓ ${preview.length} rows loaded` : "Click to select CSV file"}
          </div>
          <div className={cssClass({ fontSize: 11, color: "#9ca3af", marginTop: 4 })}>Supports .csv files</div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
            className={cssClass({ display: "none" })} />
        </div>

        {error && (
          <div className={cssClass({ background: "#fff1f2", border: "1px solid #fca5a5", borderRadius: 8,
            padding: "10px 14px", fontSize: 12, color: "#dc2626", marginBottom: 14 })}>
            {error}
          </div>
        )}

        {preview && <CSVPreviewTable preview={preview} />}

        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10 })}>
          <Btn variant="cancel" onClick={onClose}>Cancel</Btn>
          {preview && (
            <Btn variant="green" disabled={loading} onClick={handleImport}>
              <Upload size={14} />{loading ? "Importing…" : `Import ${preview.length} Holidays`}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
});

CSVUploadModal.displayName = "CSVUploadModal";
export default CSVUploadModal;
