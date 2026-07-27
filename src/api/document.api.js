import apiClient, { unwrap, unwrapList } from "./client";


export const getMyJoiningDocs = () =>
apiClient.get("/joining/my-joining-docs").then(unwrap);


export const listDocuments = (params) =>
apiClient.get("/documents", { params }).then(unwrapList);


export const getMyDocuments = (params) =>
apiClient.get("/documents/me", { params }).then(unwrapList);


export const getDocumentCategories = () =>
apiClient.get("/documents/categories").then(unwrap);





export const uploadDocument = (formData) =>
apiClient.
post("/documents", formData, {
  headers: { "Content-Type": "multipart/form-data" }
}).
then(unwrap);


export const deleteDocument = (id) =>
apiClient.delete(`/documents/${id}`).then(unwrap);
