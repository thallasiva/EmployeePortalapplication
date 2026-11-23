import apiClient from "../../../../api/client";
function pad(n) {
  return String(n).padStart(2, "0");
}
function currentMonthYear() {
  const d = new Date();
  return {
    month: pad(d.getMonth() + 1),
    year: String(d.getFullYear())
  };
}
const MONTHS = [{
  value: "01",
  label: "January"
}, {
  value: "02",
  label: "February"
}, {
  value: "03",
  label: "March"
}, {
  value: "04",
  label: "April"
}, {
  value: "05",
  label: "May"
}, {
  value: "06",
  label: "June"
}, {
  value: "07",
  label: "July"
}, {
  value: "08",
  label: "August"
}, {
  value: "09",
  label: "September"
}, {
  value: "10",
  label: "October"
}, {
  value: "11",
  label: "November"
}, {
  value: "12",
  label: "December"
}];
function yearOptions() {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1].map(String);
}
async function triggerDownload(url, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const full = `${url}${qs ? "?" + qs : ""}`;
  const resp = await apiClient.get(full, {
    responseType: "blob"
  });
  const blob = new Blob([resp.data], {
    type: resp.headers["content-type"] || "application/octet-stream"
  });
  const cd = resp.headers["content-disposition"] || "";
  const match = cd.match(/filename="?([^"]+)"?/);
  const name = match ? match[1] : "download";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
export { pad, currentMonthYear, MONTHS, yearOptions, triggerDownload };
