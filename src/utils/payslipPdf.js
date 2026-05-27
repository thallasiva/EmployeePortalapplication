function escapePdfText(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function createPayslipPdfBlob({ month, subtitle = "" }) {
  const stream = [
    `BT /F1 16 Tf 72 720 Td (${escapePdfText(`Payslip - ${month}`)}) Tj ET`,
    `BT /F1 12 Tf 72 690 Td (${escapePdfText(subtitle)}) Tj ET`,
    "BT /F1 10 Tf 72 660 Td (Sample payslip for demonstration purposes.) Tj ET",
  ].join("\n");

  const parts = [];
  const offsets = [];
  let length = 0;

  const push = (chunk) => {
    offsets.push(length);
    parts.push(chunk);
    length += chunk.length;
  };

  push("%PDF-1.4\n");
  push("1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n");
  push("2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n");
  push(
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
  );
  push(`4 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream\nendobj\n`);
  push("5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n");

  const xrefStart = length;
  const pad = (n) => String(n).padStart(10, "0");
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i += 1) {
    xref += `${pad(offsets[i])} 00000 n \n`;
  }

  const trailer = `trailer<</Size 6/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;
  const pdf = parts.join("") + xref + trailer;

  return new Blob([pdf], { type: "application/pdf" });
}
