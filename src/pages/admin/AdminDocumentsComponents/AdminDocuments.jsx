import React, { useMemo, useState } from "react";
import { FileText, Search, Upload } from "lucide-react";
import { addAdminDocument, DOCUMENT_CATEGORIES, getAdminDocuments } from "../../../data/adminDocumentsData";
import { successToast } from "../../../utils/ToastControllers";
import { DocIcon } from "./DocIcon";
import { UploadDocumentModal } from "./UploadDocumentModal";
function AdminDocuments() {
  const [documents, setDocuments] = useState(() => getAdminDocuments());
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const recentDocs = useMemo(() => documents.filter(d => d.recent).slice(0, 5), [documents]);
  const filteredDocs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter(doc => {
      const matchesTab = activeTab === "all" || doc.category === activeTab;
      const matchesSearch = !query || doc.title.toLowerCase().includes(query) || doc.description.toLowerCase().includes(query) || doc.author.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [documents, activeTab, search]);
  const handleUpload = payload => {
    addAdminDocument(payload);
    setDocuments([...getAdminDocuments()]);
    successToast("Document uploaded");
  };
  return <div className="admin-docs">
      <div className="admin-docs__header">
        <div className="admin-docs__title-row">
          <span className="admin-docs__icon-wrap">
            <FileText size={20} />
          </span>
          <div>
            <h1 className="admin-docs__title">Documents</h1>
            <p className="admin-docs__subtitle">
              Company policies, handbooks, templates, and forms
            </p>
          </div>
        </div>
        <button type="button" className="admin-docs__upload-btn" onClick={() => setUploadOpen(true)}>
          <Upload size={16} />
          Upload Document
        </button>
      </div>
      <div className="admin-docs__search">
        <Search size={16} className="admin-docs__search-icon" />
        <input type="search" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {recentDocs.length > 0 && <section>
          <p className="admin-docs__section-label">Recently Accessed</p>
          <div className="admin-docs__recent">
            {recentDocs.map(doc => <article key={doc.id} className="admin-docs__recent-card">
                <span className={`admin-docs__recent-icon admin-docs__recent-icon--${doc.icon}`}>
                  <DocIcon icon={doc.icon} size={16} />
                </span>
                <p className="admin-docs__recent-title" title={doc.title}>
                  {doc.title}
                </p>
                <p className="admin-docs__recent-size">{doc.size}</p>
              </article>)}
          </div>
        </section>}
      <div className="admin-docs__tabs">
        {DOCUMENT_CATEGORIES.map(tab => <button key={tab.id} type="button" className={`admin-docs__tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>)}
      </div>
      <section className="admin-docs__list">
        {filteredDocs.length === 0 ? <p className="admin-docs__empty">No documents found.</p> : filteredDocs.map(doc => <article key={doc.id} className="admin-docs__item">
              <span className="admin-docs__item-icon">
                <DocIcon icon={doc.icon} />
              </span>
              <div className="admin-docs__item-body">
                <div className="admin-docs__item-title-row">
                  <h3 className="admin-docs__item-title">{doc.title}</h3>
                  <span className="admin-docs__type-badge">{doc.fileType}</span>
                </div>
                <p className="admin-docs__item-desc">{doc.description}</p>
              </div>
              <div className="admin-docs__item-meta">
                <span className="admin-docs__item-size">{doc.size}</span>
                <span className="admin-docs__item-author">{doc.author}</span>
                <span className="admin-docs__item-date">{doc.date}</span>
              </div>
            </article>)}
      </section>
      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
    </div>;
}
export { AdminDocuments };
