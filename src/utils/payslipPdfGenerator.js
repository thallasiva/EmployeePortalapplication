import React from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import PayslipSheet from "../pages/payslip/PayslipSheet";

const SHEET_WIDTH_PX = 820; // matches .payslip-print-sheet max-width

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

/**
 * Renders the payslip template (the same PayslipSheet used by the on-screen
 * print view) off-screen, captures it as an image, and saves it as a
 * downloadable multi-page A4 PDF. Keeps the downloaded PDF visually
 * identical to the on-screen / print layout.
 */
export async function downloadPayslipPdf(data) {
  if (!data) throw new Error("No payslip data to export.");

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.zIndex = "-1";
  container.style.width = `${SHEET_WIDTH_PX}px`;
  container.style.background = "#ffffff";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    root.render(<PayslipSheet data={data} />);
    await waitForPaint();

    const sheet = container.querySelector(".payslip-print-sheet");
    if (!sheet) throw new Error("Could not render payslip template.");

    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: SHEET_WIDTH_PX,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const monthLabel = (data.month_name || "").replace(/\s+/g, "-");
    const empCode = data.employee?.emp_code || "payslip";
    pdf.save(`Payslip-${monthLabel}-${data.year}-${empCode}.pdf`);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
