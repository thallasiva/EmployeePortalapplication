export function downloadTemplate() {
  const yr = new Date().getFullYear();
  const rows = [
    ["holiday_name", "holiday_date", "shift", "location", "is_restricted"],
    ["Republic Day",         `${yr}-01-26`, "general", "",          0],
    ["Pongal",               `${yr}-01-14`, "general", "Chennai",   1],
    ["Holi",                 `${yr}-03-25`, "general", "",          0],
    ["Good Friday",          `${yr}-04-03`, "general", "",          0],
    ["Tamil New Year",       `${yr}-04-14`, "general", "Chennai",   1],
    ["Independence Day",     `${yr}-08-15`, "general", "",          0],
    ["Gandhi Jayanti",       `${yr}-10-02`, "general", "",          0],
    ["Diwali",               `${yr}-10-20`, "general", "",          0],
    ["Christmas",            `${yr}-12-25`, "general", "",          0],
    ["Telangana Formation",  `${yr}-06-02`, "general", "Hyderabad", 0],
    ["Karnataka Rajyotsava", `${yr}-11-01`, "general", "Bangalore", 0],
    ["Republic Day",         `${yr}-01-26`, "mid",     "",          0],
    ["Independence Day",     `${yr}-08-15`, "mid",     "",          0],
    ["Diwali",               `${yr}-10-20`, "mid",     "",          0],
    ["Christmas",            `${yr}-12-25`, "mid",     "",          0],
    ["Republic Day",         `${yr}-01-25`, "night",   "",          0],
    ["Independence Day",     `${yr}-08-14`, "night",   "",          0],
    ["Diwali",               `${yr}-10-19`, "night",   "",          0],
    ["Christmas",            `${yr}-12-24`, "night",   "",          0],
  ];
  const csv = rows.map((r) => r.join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `holiday_import_template_${yr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCSVText(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { error: "CSV must have a header row and at least one data row." };
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = lines[i].split(",");
    const obj = {};
    header.forEach((k, ci) => { obj[k] = (cells[ci] || "").trim().replace(/^"|"$/g, ""); });
    if (!obj.holiday_name || !obj.holiday_date) continue;
    const rawShift = (obj.shift || "").toLowerCase();
    obj.shift = ["general", "mid", "night"].includes(rawShift) ? rawShift : "general";
    obj.is_restricted = ["1", "true", "yes"].includes((obj.is_restricted || "").toLowerCase());
    rows.push(obj);
  }
  if (rows.length === 0) return { error: "No valid rows found. Check column names." };
  return { rows };
}
