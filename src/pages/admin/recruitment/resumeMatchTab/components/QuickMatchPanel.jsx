import React, { useState, useCallback, useRef } from "react";
import { Loader2, Zap } from "lucide-react";
import { Btn, Select, Field } from "../../shared";
import { uploadResumeMatch, getErrorMessage } from "../../../../../api/recruitment.api";
import { errorToast } from "../../../../../utils/ToastControllers";
import ScoreCircle from "./ScoreCircle";
import RecBadge from "./RecBadge";
import SkillBar from "./SkillBar";
import SkillPills from "./SkillPills";

const QuickMatchPanel = React.memo(function QuickMatchPanel({ jobs }) {
  const [jobId, setJobId] = useState("");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const jobOpts = [
    { value: "", label: "— Select Job Requirement —" },
    ...jobs.map((j) => ({ value: String(j.job_req_id), label: `${j.job_req_code || ""} — ${j.title}` })),
  ];

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!/\.(pdf|doc|docx)$/i.test(f.name)) { errorToast("Only PDF or DOCX files are supported"); return; }
    setFile(f);
    setResult(null);
  }, []);

  const handleCheck = useCallback(async () => {
    if (!jobId || !file) return;
    setLoading(true);
    setResult(null);
    try { setResult(await uploadResumeMatch(Number(jobId), file)); }
    catch (err) { errorToast(getErrorMessage(err, "Failed to parse resume")); }
    finally { setLoading(false); }
  }, [jobId, file]);

  const handleReset = useCallback(() => {
    setJobId("");
    setFile(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const matched = result?.matched ?? [];
  const missing = result?.missing ?? [];
  const rec = result?.recommendation;
  const parsed = result?.parsed;

  return (
    <div className="mb-5 rounded-xl overflow-hidden border-2 border-[#f18200] bg-white">
      <div className="flex items-center gap-2.5 px-[18px] py-3 bg-gradient-to-r from-[#fff7ed] to-white border-b border-[#fed7aa]">
        <Zap size={18} color="#f18200" />
        <div>
          <div className="text-[14px] font-bold text-gray-900">Resume Match Checker</div>
          <div className="text-[12px] text-gray-500">
            Upload a PDF or DOCX resume → system reads skills automatically → instant match score
          </div>
        </div>
      </div>

      <div className={`${result ? "grid" : ""}`} style={result ? { gridTemplateColumns: "1fr 1.2fr" } : {}}>
        <div className={`px-5 py-[18px] ${result ? "border-r border-gray-200" : ""}`}>
          <Field label="Job Requirement" required>
            <Select
              value={jobId}
              onChange={(e) => { setJobId(e.target.value); setResult(null); }}
              options={jobOpts}
            />
          </Field>
          <Field label="Upload Resume (PDF or DOCX)" required>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-[10px] py-6 px-4 text-center cursor-pointer transition-all ${
                dragging || file ? "border-[#f18200] bg-[#fff7ed]" : "border-gray-300 bg-gray-50"
              }`}
            >
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={(e) => handleFile(e.target.files[0])} />
              {file ? (
                <>
                  <div className="text-[28px] mb-1.5">📄</div>
                  <div className="text-[13px] font-bold text-[#f18200]">{file.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to change</div>
                </>
              ) : (
                <>
                  <div className="text-[28px] mb-1.5">📂</div>
                  <div className="text-[13px] font-semibold text-gray-700">Drop resume here or click to browse</div>
                  <div className="text-[11px] text-gray-400 mt-1">PDF or DOCX · Max 5 MB</div>
                </>
              )}
            </div>
          </Field>
          <div className="flex gap-2.5 mt-1">
            <Btn onClick={handleCheck} disabled={!jobId || !file || loading}
              icon={loading ? <Loader2 size={15} /> : <Zap size={15} />}>
              {loading ? "Analysing Resume…" : "Analyse & Match"}
            </Btn>
            {(file || result) && <Btn variant="secondary" onClick={handleReset}>Reset</Btn>}
          </div>
        </div>

        {result && (
          <div className="px-5 py-[18px] bg-gray-50 overflow-y-auto">
            <div className="text-[12px] font-bold text-gray-500 uppercase tracking-[0.04em] mb-3">
              Result — {result.jobTitle}
            </div>
            {parsed && (parsed.name || parsed.email || parsed.phone) && (
              <div className="bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 mb-3.5">
                <div className="text-[11px] font-bold text-gray-500 mb-1.5 uppercase">Extracted from Resume</div>
                {parsed.name && <div className="text-[13px] font-bold text-gray-900">👤 {parsed.name}</div>}
                {parsed.email && <div className="text-[12px] text-gray-500">✉ {parsed.email}</div>}
                {parsed.phone && <div className="text-[12px] text-gray-500">📞 {parsed.phone}</div>}
                <div className="text-[12px] text-gray-500 mt-1">
                  🗓 Experience detected: <strong>{result.parsed?.experience || 0} years</strong>
                </div>
                {parsed.skills?.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[11px] text-gray-400 mb-1">Skills found in resume:</div>
                    <div className="flex flex-wrap gap-1">
                      {parsed.skills.map((s) => (
                        <span key={s} className="text-[11px] px-2 py-[2px] rounded-full bg-gray-100 text-gray-700 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3.5 mb-3.5 px-3.5 py-3 bg-white rounded-[10px] border border-gray-200">
              <ScoreCircle score={result.matchScore} size={68} />
              <div>
                <RecBadge label={rec} />
                <div className="text-[11px] text-gray-500 mt-1.5">
                  Required: <strong>{result.jobExperienceLevel || "Not specified"}</strong>
                </div>
              </div>
            </div>
            <div className="mb-3.5">
              <SkillBar label="Skills (60%)" score={result.skillScore} color="#7c3aed" />
              <SkillBar label="Experience (40%)" score={result.expScore} color="#0369a1" />
            </div>
            {matched.length > 0 && (
              <div className="mb-2">
                <div className="text-[11px] font-bold text-[#f18200] mb-1.5">✔ Matched ({matched.length})</div>
                <SkillPills skills={matched} matched={true} />
              </div>
            )}
            {missing.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-red-600 mb-1.5">✖ Missing ({missing.length})</div>
                <SkillPills skills={missing} matched={false} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default QuickMatchPanel;
