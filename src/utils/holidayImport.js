/**
 * Lightweight CSV parser + mapper for the "Import Holiday Calendar" feature.
 *
 * Expected CSV columns (header row required, case-insensitive, order-independent):
 *   - Holiday Name / Name / holiday_name        (required)
 *   - Date / Holiday Date / holiday_date        (required, e.g. 2026-01-26 or 26/01/2026)
 *   - Calendar / Holiday Calendar / holiday_calendar (optional, defaults to "India - Default")
 *   - Restricted / Is Restricted / is_restricted     (optional, "yes"/"true"/"1" => true)
 */

const HEADER_ALIASES = {
  holiday_name: ["holiday name", "name", "holiday_name", "holiday"],
  holiday_date: ["date", "holiday date", "holiday_date"],
  holiday_calendar: ["calendar", "holiday calendar", "holiday_calendar"],
  is_restricted: ["restricted", "is restricted", "is_restricted", "restricted holiday"],
};

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

/** Normalizes common date formats to YYYY-MM-DD. Returns null if unparseable. */
function normalizeDate(value) {
  if (!value) return null;
  const trimmed = String(value).trim();

  // Already ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Fallback: let Date try (handles "26 Jan 2026", "Jan 26, 2026", etc.)
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

function toBoolean(value) {
  if (value === undefined || value === null) return false;
  const v = String(value).trim().toLowerCase();
  return v === "yes" || v === "true" || v === "1" || v === "y";
}

/**
 * Parses CSV text into an array of holiday objects ready for the
 * `importHolidays` API call. Throws an Error with a user-friendly message
 * if the file has no usable rows.
 */
export function parseHolidayCsv(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error("The file must contain a header row and at least one holiday row.");
  }

  const headerCells = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const columnIndex = {};

  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    const idx = headerCells.findIndex((h) => aliases.includes(h));
    if (idx !== -1) columnIndex[field] = idx;
  });

  if (columnIndex.holiday_name === undefined || columnIndex.holiday_date === undefined) {
    throw new Error(
      'The file must have "Holiday Name" and "Date" columns (a header row is required).'
    );
  }

  const holidays = [];
  const errors = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const name = cells[columnIndex.holiday_name]?.trim();
    const rawDate = cells[columnIndex.holiday_date]?.trim();
    if (!name && !rawDate) continue; // skip blank rows

    const date = normalizeDate(rawDate);
    if (!name || !date) {
      errors.push(`Row ${i + 1}: could not read holiday name/date ("${name || ""}", "${rawDate || ""}")`);
      continue;
    }

    holidays.push({
      holiday_name: name,
      holiday_date: date,
      holiday_calendar:
        columnIndex.holiday_calendar !== undefined
          ? cells[columnIndex.holiday_calendar]?.trim() || "India - Default"
          : "India - Default",
      is_restricted:
        columnIndex.is_restricted !== undefined
          ? toBoolean(cells[columnIndex.is_restricted])
          : false,
    });
  }

  if (holidays.length === 0) {
    throw new Error(errors[0] || "No valid holiday rows were found in the file.");
  }

  return { holidays, errors };
}
