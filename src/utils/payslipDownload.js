import { downloadBlob, downloadFromUrl } from "./fileDownload";
import { createPayslipPdfBlob } from "./payslipPdf";

function payslipFilename(row) {
  return row.file || `${row.month.replace(/\s+/g, "-")}.pdf`;
}

function payslipBlob(row) {
  return createPayslipPdfBlob({
    month: row.month,
    subtitle: row.text,
  });
}

export function downloadPayslip(row) {
  const filename = payslipFilename(row);

  if (row.fileUrl) {
    return downloadFromUrl(row.fileUrl, filename);
  }

  downloadBlob(payslipBlob(row), filename);
  return Promise.resolve();
}

export function viewPayslip(row) {
  if (row.fileUrl) {
    window.open(row.fileUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const url = URL.createObjectURL(payslipBlob(row));
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
