import apiClient from "../../../api/client";
function fileUrl(relPath) {
  if (!relPath) return "#";
  const base = apiClient.defaults?.baseURL?.replace(/\/api\/?$/, "") || "";
  return `${base}${relPath}`;
}
export { fileUrl };
