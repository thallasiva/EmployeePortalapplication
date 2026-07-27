import React, { useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";







export default function SignatureUpload({ form, setForm }) {
  const ref = useRef();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((p) => ({ ...p, signaturePreview: ev.target.result, signatureFile: file }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function clear() {
    setForm((p) => ({ ...p, signaturePreview: "", signatureFile: null }));
  }

  const preview = form.signaturePreview;

  return (
    <div>
      <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1">
        Signature (Upload Image)<span className="text-red-500 ml-0.5">*</span>
      </label>

      {preview ?
      <div className="relative inline-flex flex-col items-start gap-2">
          <div className="w-[260px] overflow-hidden rounded-xl border-2 border-[#d97706] bg-white p-1.5">
            <img src={preview} alt="Signature" className="max-h-20 w-full object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => ref.current?.click()}
          className="text-[11px] font-semibold text-[#d97706] hover:underline">
              Change
            </button>
            <span className="text-gray-300">|</span>
            <button type="button" onClick={clear}
          className="text-[11px] font-semibold text-red-500 hover:underline flex items-center gap-1">
              <X size={11} /> Remove
            </button>
          </div>
        </div> :

      <button type="button" onClick={() => ref.current?.click()}
      className="flex items-center gap-2.5 px-4 py-3 border-2 border-dashed border-amber-300 rounded-xl text-[13px] text-amber-700 hover:border-[#d97706] hover:bg-amber-50 transition-colors w-full">
          <div className="p-1.5 rounded-lg bg-amber-100"><ImageIcon size={15} className="text-[#d97706]" /></div>
          <div className="text-left">
            <p className="font-semibold text-[12px]">Upload Signature Image</p>
            <p className="text-[11px] text-gray-500">JPG, PNG or GIF — clear signature on white background</p>
          </div>
          <Upload size={14} className="ml-auto text-amber-400" />
        </button>
      }

      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>);

}
