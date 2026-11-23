import { Upload, CheckCircle } from "lucide-react";
export const DocUploadCard = ({
  label,
  nameKey,
  fileKey,
  inputRef,
  form,
  handleFileUpload,
  setForm
}) => {
  const uploaded = form[nameKey];
  return <div className={`border-2 border-dashed rounded-xl px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${uploaded ? "border-green-400 bg-green-50" : "border-amber-300 bg-amber-50 hover:border-[#d97706]"}`} onClick={() => inputRef.current?.click()}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" ref={inputRef} className="hidden" onChange={e => handleFileUpload(e.target.files[0], nameKey, fileKey)} />
        <div className="flex items-center gap-2 min-w-0">
          {uploaded ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" /> : <Upload size={16} className="text-amber-500 flex-shrink-0" />}
          <span className={`text-[12px] truncate ${uploaded ? "text-green-700 font-medium" : "text-amber-700"}`}>
            {uploaded || `Upload ${label} (.pdf / .jpg / .png)`}
          </span>
        </div>
        {uploaded ? <button type="button" className="text-[11px] text-amber-600 underline flex-shrink-0" onClick={e => {
      e.stopPropagation();
      setForm(p => ({
        ...p,
        [nameKey]: "",
        [fileKey]: null
      }));
    }}>
            Remove
          </button> : <span className="text-[11px] text-amber-500 bg-amber-100 px-2 py-0.5 rounded flex-shrink-0">Browse</span>}
      </div>;
};
