import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddDocuments from "../../component/AddDocuments";

export function EmployeeDocument()
{
  const cards = [
    { title: "Passport", file: "Passport.pdf" },
    { title: "P45", file: "Passport.pdf" },
    { title: "P45", file: "Visa.pdf" },
  ];

  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const enableModel = () =>
  {
    setShowModal(true);
    console.log(showModal);

  }
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg">Basic Information</h2>
          <button className="bg-brand text-white px-6 py-2 rounded-md font-semibold" onClick={enableModel}>
            Add Document
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cards.map((c, i) => (
            <div key={i} className="bg-white border rounded-xl shadow-sm">
              <div className="p-4 border-b font-semibold text-xl">
                {c.title}
              </div>
              <div className="p-4">
                <div className="border rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-500">📄</span>
                    <span>{c.file}</span>
                  </div>
                  <button className="w-8 h-8 border rounded text-indigo-600">
                    ✎
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-12 bg-indigo-700 text-white px-6 py-2 rounded-md font-semibold" onClick={() => navigate('/add-document')}>
          Add New Document
        </button>
      </div>

         {showModal && (
        <AddDocuments setShowModal={setShowModal} showModal={showModal} />
      )}
    </div>

  );
}