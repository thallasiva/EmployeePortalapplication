import React, { useRef } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Field } from "../../shared";
import ScorePanel from "./ScorePanel";

const ResumeUploadStep = React.memo(function ResumeUploadStep({
  jobs, form, file, parsing, preScoring, preScore, scoreErr, parseErr,
  onFileChange, onFormChange
}) {
  const fileRef = useRef(null);

  return (
    <div>
      <div className="mb-4 px-3.5 py-2.5 bg-amber-50 rounded-lg border-l-[3px] border-l-[#f18200] text-sm text-amber-800">
        Select the job position, then upload a resume to auto-extract candidate details.
      </div>

      <Field label="Job / Position" required>
        <select
          name="jobReqId"
          value={form.jobReqId}
          onChange={onFormChange}
          className={`w-full text-sm px-2.5 py-2 border border-gray-200 rounded-lg bg-white outline-none ${form.jobReqId ? "text-gray-900" : "text-gray-400"}`}>
          <option value="">Select job requirement</option>
          {jobs.map((j) =>
            <option key={j.job_req_id} value={String(j.job_req_id)}>
              {j.job_req_code} — {j.title} ({j.client})
            </option>
          )}
        </select>
      </Field>

      <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2.5">Upload Resume</div>

      <div
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl px-6 py-7 text-center cursor-pointer transition-all ${file ? "border-[#f18200] bg-amber-50" : "border-gray-300 bg-gray-50"}`}>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={onFileChange} className="hidden" />
        {file ? (
          <>
            <div className="flex justify-center mb-2"><CheckCircle size={28} color="#f18200" /></div>
            <div className="text-sm font-bold text-gray-900 mb-0.5">{file.name}</div>
            <div className="text-[11px] text-gray-500">{(file.size / 1024).toFixed(1)} KB — click to change</div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-2.5"><Upload size={28} color="#9ca3af" /></div>
            <div className="text-sm font-semibold text-gray-700 mb-1">Click to upload resume</div>
            <div className="text-xs text-gray-400">Supported: PDF, DOC, DOCX — Max 5 MB</div>
          </>
        )}
      </div>

      {file && form.jobReqId &&
        <div className="mt-3.5">
          {preScoring &&
            <div className="flex items-center gap-2.5 px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200">
              <Loader2 size={18} color="#f18200" className="animate-spin flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-gray-700">Analysing resume…</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Computing match score against the selected job</div>
              </div>
            </div>
          }
          {!preScoring && scoreErr &&
            <div className="px-3.5 py-2.5 bg-red-50 rounded-lg border-l-[3px] border-l-red-500 text-sm text-red-800 flex gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <div>{scoreErr} — you can still proceed to parse manually.</div>
            </div>
          }
          {!preScoring && preScore && <ScorePanel score={preScore} showHint />}
        </div>
      }

      {file && !form.jobReqId &&
        <div className="mt-3 px-3.5 py-2.5 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 text-center">
          Select a job above to see the resume match score
        </div>
      }

      {parseErr &&
        <div className="mt-3 px-3.5 py-2.5 bg-red-50 rounded-lg border-l-[3px] border-l-red-500 text-sm text-red-800 flex gap-2">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {parseErr}
        </div>
      }
    </div>
  );
});

export default ResumeUploadStep;
