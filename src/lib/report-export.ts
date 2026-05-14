import Papa from "papaparse";

import type { ReportItem } from "@/types/report";

type JsPdfModule = typeof import("jspdf");
type AutoTableModule = typeof import("jspdf-autotable");

const PDF_FILE_PREFIX = "pr-article-report";
const CSV_FILE_PREFIX = "pr-article-report";

export async function downloadPdfReport(items: ReportItem[]) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf") as Promise<JsPdfModule>,
    import("jspdf-autotable") as Promise<AutoTableModule>,
  ]);

  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ format: "a4", orientation: "portrait", unit: "pt" });
  const generatedAt = new Date();
  const successfulCount = items.filter((item) => item.status === "success").length;
  const failedCount = items.length - successfulCount;
  const uniqueCategories = new Set(
    items.map((item) => item.category.trim()).filter(Boolean),
  ).size;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 40;
  const right = pageWidth - 40;

  doc.setFillColor(10, 30, 46);
  doc.roundedRect(left, 28, pageWidth - 80, 88, 18, 18, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("PR Article Report", left + 22, 62);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Generated ${formatDisplayDate(generatedAt.toISOString())}  |  ${items.length} URLs`,
    left + 22,
    84,
  );

  const cards = [
    { label: "Total URLs", value: String(items.length) },
    { label: "Successful", value: String(successfulCount) },
    { label: "Failed", value: String(failedCount) },
    { label: "Unique Categories", value: String(uniqueCategories) },
  ];

  cards.forEach((card, index) => {
    const x = left + index * 128;
    doc.setFillColor(244, 247, 251);
    doc.roundedRect(x, 136, 116, 64, 14, 14, "F");
    doc.setTextColor(84, 101, 118);
    doc.setFontSize(9);
    doc.text(card.label, x + 14, 158);
    doc.setTextColor(10, 30, 46);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(card.value, x + 14, 184);
    doc.setFont("helvetica", "normal");
  });

  autoTable(doc, {
    startY: 228,
    margin: { left, right: pageWidth - right },
    head: [["No", "Title", "Category", "Domain", "Status"]],
    body: items.map((item, index) => [
      String(index + 1),
      item.title || "Untitled article",
      item.category || "Uncategorized",
      item.domain || "-",
      item.status,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 8,
      textColor: [24, 36, 48],
      lineColor: [226, 232, 240],
      lineWidth: 0.6,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [18, 52, 86],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [250, 252, 255],
    },
    columnStyles: {
      0: { cellWidth: 34, halign: "center" },
      1: { cellWidth: 208 },
      2: { cellWidth: 110 },
      3: { cellWidth: 96 },
      4: { cellWidth: 56, halign: "center" },
    },
    didDrawPage: () => {
      const page = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(9);
      doc.setTextColor(110, 120, 135);
      doc.text(`Page ${page}`, pageWidth / 2, pageHeight - 18, { align: "center" });
    },
  });

  doc.save(`${PDF_FILE_PREFIX}-${formatFileStamp(generatedAt)}.pdf`);
}

export function downloadCsvReport(items: ReportItem[]) {
  const csv = Papa.unparse(
    items.map((item, index) => ({
      "No": index + 1,
      "URL": item.url,
      "Domain": item.domain,
      "Title": item.title,
      "Category": item.category,
      "Description": item.description,
      "Author": item.author,
      "Published Time": item.publishedTime,
      "Status": item.status,
      "Error": item.error,
      "Crawled At": item.crawledAt,
    })),
  );

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${CSV_FILE_PREFIX}-${formatFileStamp(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function formatDisplayDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileStamp(date: Date) {
  return date.toISOString().slice(0, 19).replace(/[:T]/g, "-");
}
