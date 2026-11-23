import React, { useState, useCallback, useRef } from "react";
import { Loader2, Zap, FileText, FolderOpen } from "lucide-react";
import { Btn, Select, Field } from "../../../shared";
import { uploadResumeMatch } from "../../../../../../api/recruitment.api";
import { apiErrorToast, errorToast } from "../../../../../../utils/ToastControllers";
import { ParsedDetail } from "./ParsedDetail";
/* ── Main panel ── */
const QuickMatchPanel = React.memo(function QuickMatchPanel({
  jobs
}) {
  const [jobId, setJobId] = useState("");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const jobOpts = [{
    value: "",
    label: "— Select Job Requirement —"
  }, ...jobs.map(j => ({
    value: String(j.job_req_id),
    label: `${j.job_req_code || ""} — ${j.title}`
  }))];
  const handleFile = useCallback(f => {
    if (!f) return;
    if (!/\.(pdf|doc|docx)$/i.test(f.name)) {
      errorToast("Only PDF or DOCX files are supported");
      return;
    }
    setFile(f);
    setResult(null);
  }, []);
  const handleCheck = useCallback(async () => {
    if (!jobId || !file) return;
    setLoading(true);
    setResult(null);
    try {
      setResult(await uploadResumeMatch(Number(jobId), file));
    } catch (err) {
      apiErrorToast(err, "Failed to parse resume");
    } finally {
      setLoading(false);
    }
  }, [jobId, file]);
  const handleReset = useCallback(() => {
    setJobId("");
    setFile(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);
  const parsed = result?.parsed;
  return <div className="mb-5 rounded-xl overflow-hidden border-2 border-[#e87500] bg-white">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-[18px] py-3 bg-gradient-to-r from-[#fff7ed] to-white border-b border-[#fed7aa]">
        <Zap size={18} color="#e87500" />
        <div>
          <div className="text-[14px] font-bold text-gray-900">Resume Match Checker</div>
          <div className="text-[12px] text-gray-500">
            Upload PDF or DOCX — AI extracts all fields and gives an instant match score
          </div>
        </div>
      </div>
      <div className={result ? "grid" : ""} style={result ? {
      gridTemplateColumns: "1fr 1.4fr"
    } : {}}>
        {/* Upload form */}
        <div className={`px-5 py-[18px] ${result ? "border-r border-gray-200" : ""}`}>
          <Field label="Job Requirement" required>
            <Select value={jobId} onChange={e => {
            setJobId(e.target.value);
            setResult(null);
          }} options={jobOpts} />
          </Field>
          <Field label="Upload Resume (PDF / DOC / DOCX)" required>
            <div onDragOver={e => {
            e.preventDefault();
            setDragging(true);
          }} onDragLeave={() => setDragging(false)} onDrop={e => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }} onClick={() => fileRef.current?.click()} className={`border-2 border-dashed rounded-[10px] py-6 px-4 text-center cursor-pointer transition-all ${dragging || file ? "border-[#e87500] bg-[#fff7ed]" : "border-gray-300 bg-gray-50"}`}>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              {file ? <>
                  <div className="mb-1.5 flex justify-center text-[#e87500]"><FileText size={28} /></div>
                  <div className="text-[13px] font-bold text-[#e87500]">{file.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to change</div>
                </> : <>
                  <div className="mb-1.5 flex justify-center text-[#e87500]"><FolderOpen size={28} /></div>
                  <div className="text-[13px] font-semibold text-gray-700">Drop resume here or click to browse</div>
                  <div className="text-[11px] text-gray-400 mt-1">PDF or DOCX · Max 5 MB</div>
                </>}
            </div>
          </Field>
          <div className="flex gap-2.5 mt-1">
            <Btn onClick={handleCheck} disabled={!jobId || !file || loading} icon={loading ? <Loader2 size={15} /> : <Zap size={15} />}>
              {loading ? "Analysing…" : "Analyse & Match"}
            </Btn>
            {(file || result) && <Btn variant="secondary" onClick={handleReset}>Reset</Btn>}
          </div>
        </div>
        {/* Dynamic parsed result */}
        {result && <ParsedDetail parsed={parsed} result={result} />}
      </div>
    </div>;
});
export { QuickMatchPanel };
