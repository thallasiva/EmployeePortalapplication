import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const createTextValueNode = (
  ownerDocument: Document,
  value: string
): HTMLDivElement => {
  const node = ownerDocument.createElement('div');
  node.textContent = value || ' ';
  node.style.minHeight = '38px';
  node.style.padding = '0.375rem 0.75rem';
  node.style.whiteSpace = 'pre-wrap';
  node.style.wordBreak = 'break-word';
  node.style.border = 'none';
  node.style.background = 'transparent';
  return node;
};

const prepareCloneForPdf = (sourceElement: HTMLElement): HTMLElement => {
  const clonedElement = sourceElement.cloneNode(true) as HTMLElement;
  clonedElement.style.display = 'block';
  clonedElement.style.visibility = 'visible';
  clonedElement.style.height = 'auto';
  clonedElement.style.maxHeight = 'none';
  clonedElement.style.overflow = 'visible';

  clonedElement
    .querySelectorAll<HTMLElement>('button, [data-pdf-hide="true"]')
    .forEach((element) => element.remove());

  clonedElement.querySelectorAll<HTMLElement>('input, textarea, select').forEach((element) => {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'hidden') {
        element.remove();
        return;
      }

      if (element.type === 'checkbox' || element.type === 'radio') {
        element.disabled = true;
        return;
      }

      const textNode = createTextValueNode(element.ownerDocument, element.value);
      element.replaceWith(textNode);
      return;
    }

    if (element instanceof HTMLTextAreaElement) {
      const textNode = createTextValueNode(element.ownerDocument, element.value);
      textNode.style.minHeight = '72px';
      element.replaceWith(textNode);
      return;
    }

    if (element instanceof HTMLSelectElement) {
      const selectedText = element.options[element.selectedIndex]?.text ?? '';
      const textNode = createTextValueNode(element.ownerDocument, selectedText);
      element.replaceWith(textNode);
    }
  });

  const styleTag = clonedElement.ownerDocument.createElement('style');
  styleTag.textContent = `
    * {
      box-shadow: none !important;
    }

    iframe {
      display: none !important;
    }

    .card,
    .table,
    .table td,
    .table th,
    .border,
    .rounded,
    .rounded-4 {
      border-color: #d7d7d7 !important;
    }

    [data-pdf-keep-together="true"],
    .card,
    .row,
    table,
    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  `;
  clonedElement.prepend(styleTag);

  return clonedElement;
};

export const downloadElementAsPdf = async (
  sourceElement: HTMLElement,
  fileName: string
): Promise<void> => {
  const blob = await renderElementToPdfBlob(sourceElement);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const renderElementToPdfBlob = async (
  sourceElement: HTMLElement
): Promise<Blob> => {
  let pdfContainer: HTMLDivElement | null = null;

  try {
    pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'fixed';
    pdfContainer.style.left = '-20000px';
    pdfContainer.style.top = '0';
    pdfContainer.style.width = `${Math.max(sourceElement.scrollWidth, 900)}px`;
    pdfContainer.style.padding = '24px';
    pdfContainer.style.background = '#ffffff';
    pdfContainer.style.zIndex = '-1';

    const printableClone = prepareCloneForPdf(sourceElement);
    pdfContainer.appendChild(printableClone);
    document.body.appendChild(pdfContainer);

    await new Promise((resolve) => window.setTimeout(resolve, 100));

    const canvas = await html2canvas(pdfContainer, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imageWidth = pageWidth - margin * 2;
    const pageHeightContent = pageHeight - margin * 2;
    const pageCanvasHeight = Math.floor((pageHeightContent * canvas.width) / imageWidth);

    const sourceRect = printableClone.getBoundingClientRect();
    const renderedWidth =
      sourceRect.width || sourceElement.scrollWidth || pdfContainer.offsetWidth;
    const canvasScale = canvas.width / renderedWidth;

    const keepTogetherRanges = Array.from(
      printableClone.querySelectorAll<HTMLElement>(
        '[data-pdf-keep-together="true"], .card'
      )
    )
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const start = Math.max(
          0,
          Math.floor((rect.top - sourceRect.top) * canvasScale)
        );
        const end = Math.min(
          canvas.height,
          Math.ceil((rect.bottom - sourceRect.top) * canvasScale)
        );
        return { start, end };
      })
      .filter(
        (range) =>
          range.end > range.start &&
          range.end - range.start < pageCanvasHeight
      );

    let sourceY = 0;

    while (sourceY < canvas.height) {
      let currentPageCanvasHeight = Math.min(
        pageCanvasHeight,
        canvas.height - sourceY
      );
      const pageEnd = sourceY + currentPageCanvasHeight;

      const splitRange = keepTogetherRanges.find(
        (range) =>
          range.start > sourceY &&
          range.start < pageEnd &&
          range.end > pageEnd
      );

      if (splitRange) {
        currentPageCanvasHeight = splitRange.start - sourceY;
      }

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = currentPageCanvasHeight;

      const pageContext = pageCanvas.getContext('2d');
      if (!pageContext) {
        throw new Error('Unable to prepare PDF canvas.');
      }

      pageContext.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        currentPageCanvasHeight,
        0,
        0,
        canvas.width,
        currentPageCanvasHeight
      );

      if (sourceY > 0) {
        pdf.addPage();
      }

      const pageImgData = pageCanvas.toDataURL('image/png');
      const pageImgHeight = (currentPageCanvasHeight * imageWidth) / canvas.width;

      pdf.addImage(pageImgData, 'PNG', margin, margin, imageWidth, pageImgHeight);
      sourceY += currentPageCanvasHeight;
    }

    return pdf.output('blob');
  } finally {
    if (pdfContainer?.parentNode) {
      pdfContainer.parentNode.removeChild(pdfContainer);
    }
  }
};

export const downloadFileFromUrl = (fileUrl: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
