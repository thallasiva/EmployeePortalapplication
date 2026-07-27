import apiClient, { unwrap, unwrapList } from "./client";

/** GET /joining/my-joining-docs — employee's own joining doc URLs + acknowledgment flags */
export const getMyJoiningDocs = () =>
  apiClient.get("/joining/my-joining-docs").then(unwrap);

/** GET /documents — admin list (supports ?employee_id=, ?category_id=, ?visibility=, ?search=) */
export const listDocuments = (params) =>
  apiClient.get("/documents", { params }).then(unwrapList);

/** GET /documents/me — logged-in employee's own documents */
export const getMyDocuments = (params) =>
  apiClient.get("/documents/me", { params }).then(unwrapList);

/** GET /documents/categories */
export const getDocumentCategories = () =>
  apiClient.get("/documents/categories").then(unwrap);

/**
 * POST /documents — upload a document (multipart/form-data).
 * Pass a FormData instance; set employee_id to link the doc to a specific employee.
 */
export const uploadDocument = (formData) =>
  apiClient
    .post("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(unwrap);

/** DELETE /documents/:id */
export const deleteDocument = (id) =>
  apiClient.delete(`/documents/${id}`).then(unwrap);
