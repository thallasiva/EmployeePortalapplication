/**
 * Lightweight CSV parser + mapper for the "Import Salary Structures" feature
 * on the Admin Payslips page.
 *
 * Expected CSV columns (header row required, case-insensitive, order-independent):
 *   - Employee Code / Emp Code / emp_code            (required, must match an existing employee)
 *   - Basic / basic                                  (optional, numeric)
 *   - HRA / hra                                       (optional, numeric)
 *   - Conveyance / conveyance                         (optional, numeric)
 *   - Medical Allowance / medical_allowance           (optional, numeric)
 *   - Special Allowance / special_allowance           (optional, numeric)
 *   - PF Employee / pf_employee                       (optional, numeric)
 *   - PF Employer / pf_employer                       (optional, numeric)
 *   - Professional Tax / professional_tax             (optional, numeric)
 *   - Income Tax / income_tax                         (optional, numeric)
 *   - CTC / ctc                                       (optional, numeric)
 *   - Effective From / effective_from                 (required, e.g. 2026-04-01 or 01/04/2026)
 */

const HEADER_ALIASES = {
  emp_code: ["employee code", "emp code", "emp_code", "employee_code", "code"],
  basic: ["basic", "basic salary"],
  hra: ["hra"],
  conveyance: ["conveyance", "conveyance allowance"],
  medical_allowance: ["medical allowance", "medical_allowance"],
  special_allowance: ["special allowance", "special_allowance"],
  pf_employee: ["pf employee", "pf_employee", "employee pf"],
  pf_employer: ["pf employer", "pf_employer", "employer pf"],
  professional_tax: ["professional tax", "professional_tax", "prof tax"],
  income_tax: ["income tax", "income_tax", "tds"],
  ctc: ["ctc", "annual ctc"],
  effective_from: ["effective from", "effective_from", "effective date", "from date"],
};

const NUMERIC_FIELDS = [
  "basic", "hra", "conveyance", "medical_allowance", "special_allowance",
  "pf_employee", "pf_employer", "professional_tax", "income_tax", "ctc",
];

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

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const cleaned = String(value).replace(/[,₹\s]/g, "");
  const num = Number(cleaned);
  return Number.isNaN(num) ? undefined : num;
}

/**
 * Parses CSV text into an array of salary structure objects ready for the
 * `importSalaryStructures` API call. Throws an Error with a user-friendly
 * message if the file has no usable rows.
 */
export function parseSalaryStructureCsv(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error("The file must contain a header row and at least one row.");
  }

  const headerCells = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const columnIndex = {};

  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    const idx = headerCells.findIndex((h) => aliases.includes(h));
    if (idx !== -1) columnIndex[field] = idx;
  });

  if (columnIndex.emp_code === undefined || columnIndex.effective_from === undefined) {
    throw new Error(
      'The file must have "Employee Code" and "Effective From" columns (a header row is required).'
    );
  }

  const items = [];
  const errors = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const empCode = cells[columnIndex.emp_code]?.trim();
    const rawDate = cells[columnIndex.effective_from]?.trim();
    if (!empCode && !rawDate) continue; // skip blank rows

    const effectiveFrom = normalizeDate(rawDate);
    if (!empCode || !effectiveFrom) {
      errors.push(`Row ${i + 1}: could not read employee code/effective date ("${empCode || ""}", "${rawDate || ""}")`);
      continue;
    }

    const item = { emp_code: empCode, effective_from: effectiveFrom };
    NUMERIC_FIELDS.forEach((field) => {
      if (columnIndex[field] !== undefined) {
        const value = toNumber(cells[columnIndex[field]]);
        if (value !== undefined) item[field] = value;
      }
    });

    items.push(item);
  }

  if (items.length === 0) {
    throw new Error(errors[0] || "No valid rows were found in the file.");
  }

  return { items, errors };
}

/** Builds a downloadable CSV template for the salary structure import. */
export function buildSalaryStructureCsvTemplate() {
  const headers = [
    "Employee Code", "Basic", "HRA", "Conveyance", "Medical Allowance",
    "Special Allowance", "PF Employee", "PF Employer", "Professional Tax",
    "Income Tax", "CTC", "Effective From",
  ];
  const sample = ["EMP00003", "25000", "10000", "1600", "1250", "5000", "1800", "1800", "200", "0", "60000", "2026-04-01"];
  return [headers.join(","), sample.join(",")].join("\r\n");
}

/** Triggers a browser download of the salary structure CSV template. */
export function downloadSalaryStructureCsvTemplate(filename = "salary-structure-template.csv") {
  const csv = buildSalaryStructureCsvTemplate();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
