import React, { useState } from "react";
import { Plus, Pencil, X, Upload } from "lucide-react";
import AddDocuments from "../../component/AddDocuments";

export default function AddDocumentScreen()
{
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState([
    { id: 1, name: "Passport.pdf" },
  ]);
  const [docName, setDocName] = useState("");
  const [file, setFile] = useState(null);

  const handleAddDocument = () =>
  {
    if (!docName || !file) return;

    const newDoc = {
      id: Date.now(),
      name: file.name,
      description: docName,
    };

    setDocuments([...documents, newDoc]);
    setDocName("");
    setFile(null);
    setShowModal(false);
  };

  const enableModel = () => {
    setShowModal(true);
    console.log(showModal);
    
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="bg-[#f4f5f7] mb-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-[22px] font-semibold text-[#1f2a44]">
              Payroll Details
            </h2>
          </div>

          {/* Row 1 */}
          <div className="px-2 py-2">
            <div className="border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-between hover:shadow-sm transition">
              <span className="text-[15px] font-medium text-black">
                Add Bank Name
              </span>

              <button className="w-9 h-9 rounded-md border border-gray-300 flex items-center justify-center text-indigo-600 hover:bg-indigo-50">
                ✎
              </button>
            </div>
          </div>

          {/* Row 2 */}
          <div className="px-2 py-2">
            <div className="border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-between hover:shadow-sm transition">
              <span className="text-[15px] font-medium text-black">
                Add Bank Account Number
              </span>

              <button className="w-9 h-9 rounded-md border border-gray-300 flex items-center justify-center text-indigo-600 hover:bg-indigo-50">
                ✎
              </button>
            </div>
          </div>

          {/* Row 3 */}
          <div className="px-2 py-2">
            <div className="border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-between hover:shadow-sm transition">
              <span className="text-[15px] font-medium text-black">
                Add Bank Sort Code
              </span>

              <button className="w-9 h-9 rounded-md border border-gray-300 flex items-center justify-center text-indigo-600 hover:bg-indigo-50">
                ✎
              </button>
            </div>
          </div>

        </div>
      </div>
      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-md border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Basic Information
            </h2>

            <div className="flex gap-2">
              <button
                onClick={enableModel}
                className="w-9 h-9 rounded-md border flex items-center justify-center text-brand hover:bg-brand-50"
              >
                <Plus size={18} />
              </button>

              <button className="w-9 h-9 rounded-md border flex items-center justify-center text-red-500 hover:bg-red-50">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Bank Name</span>
              <span className="text-brand-700 font-medium">
                Life Essence Banks, Inc.
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Bank Account Number</span>
              <span className="text-brand-700 font-medium">112300987652</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Bank Sort Code</span>
              <span className="text-brand-700 font-medium">LE00652</span>
            </div>
          </div>
        </div>

        {/* Document Card */}
        <div className="bg-white rounded-xl shadow-md border">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">P45</h2>
          </div>

          <div className="p-5 space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-red-500 text-lg">📄</span>
                  <span className="text-sm font-medium text-gray-700">
                    {doc.name}
                  </span>
                </div>

                <button className="w-8 h-8 border rounded-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50">
                  <Pencil size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Salary Card */}
        <div className="bg-white rounded-xl shadow-md border">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">P45</h2>
          </div>

          <div className="p-5">
            <div className="border rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Current Salary
              </span>

              <button className="w-8 h-8 border rounded-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50">
                <Pencil size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <AddDocuments setShowModal={setShowModal} showModal={showModal} />
      )}

    </div>
  );
}