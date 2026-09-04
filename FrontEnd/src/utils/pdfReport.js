import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const BRAND_GREEN = [31, 90, 63]; // #1F5A3F
const INK = [29, 42, 34]; // #1D2A22
const MUTED = [107, 114, 128]; // #6B7280
const LINE = [231, 227, 216]; // #E7E3D8

const PAGE_MARGIN = 40;

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

const DIET_LABELS = {
  Balanced: 'Balanced Diet',
  Low_Carb: 'Low-Carb Diet',
  Low_Sodium: 'Low-Sodium Diet',
};

/**
 * Captures a DOM node as a JPEG data URL for embedding in the PDF. Returns
 * null on failure instead of throwing — a chart image is a nice-to-have,
 * not worth failing the whole report over.
 */
async function captureElement(el) {
  if (!el) return null;
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 1.5,
      logging: false,
    });
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), width: canvas.width, height: canvas.height };
  } catch {
    return null;
  }
}

function addHeader(doc, { dietLabel, generatedAt }) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...BRAND_GREEN);
  doc.roundedRect(PAGE_MARGIN, 36, 28, 28, 6, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('N', PAGE_MARGIN + 14, 55, { align: 'center' });

  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('NutriPredict', PAGE_MARGIN + 38, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('AI-powered nutrition outcome prediction', PAGE_MARGIN + 38, 64);

  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text(generatedAt, pageWidth - PAGE_MARGIN, 52, { align: 'right' });

  doc.setDrawColor(...LINE);
  doc.line(PAGE_MARGIN, 82, pageWidth - PAGE_MARGIN, 82);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text('Nutrition Recommendation Report', PAGE_MARGIN, 112);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_GREEN);
  doc.text(`Recommended: ${dietLabel}`, PAGE_MARGIN, 130);

  return 150;
}

function addMetricsRow(doc, y, metrics) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - PAGE_MARGIN * 2;
  const gap = 12;
  const boxWidth = (usableWidth - gap * 3) / 4;
  const boxHeight = 62;

  metrics.forEach((m, i) => {
    const x = PAGE_MARGIN + i * (boxWidth + gap);
    doc.setDrawColor(...LINE);
    doc.setFillColor(247, 246, 241);
    doc.roundedRect(x, y, boxWidth, boxHeight, 8, 8, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(m.label.toUpperCase(), x + 10, y + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...INK);
    doc.text(String(m.value), x + 10, y + 42);
  });

  return y + boxHeight + 24;
}

async function addChartImage(doc, y, ref, title, maxHeight = 170) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - PAGE_MARGIN * 2;

  const captured = await captureElement(ref?.current);
  if (!captured) return y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(title, PAGE_MARGIN, y);
  y += 12;

  const aspect = captured.height / captured.width;
  let drawWidth = usableWidth;
  let drawHeight = drawWidth * aspect;
  if (drawHeight > maxHeight) {
    drawHeight = maxHeight;
    drawWidth = drawHeight / aspect;
  }

  doc.addImage(captured.dataUrl, 'JPEG', PAGE_MARGIN, y, drawWidth, drawHeight);
  return y + drawHeight + 24;
}

function addMealPlanTable(doc, y, mealPlan) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text('Meal Plan', PAGE_MARGIN, y);

  const sorted = [...mealPlan].sort((a, b) => MEAL_ORDER.indexOf(a.meal) - MEAL_ORDER.indexOf(b.meal));

  autoTable(doc, {
    startY: y + 10,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [['Meal', 'Food', 'Portion (g)', 'Calories', 'Protein (g)', 'Fat (g)', 'Carbs (g)']],
    body: sorted.map((item) => [
      item.meal,
      item.food,
      item.portionG,
      Math.round(item.calories),
      item.protein,
      item.fat,
      item.carbohydrates,
    ]),
    styles: { fontSize: 8.5, textColor: INK, cellPadding: 5 },
    headStyles: { fillColor: BRAND_GREEN, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 246, 241] },
    theme: 'grid',
    tableWidth: pageWidth - PAGE_MARGIN * 2,
    columnStyles: { 1: { cellWidth: 170 } },
  });

  return doc.lastAutoTable.finalY + 24;
}

function addNutritionSummary(doc, y, totals) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text('Daily Nutrition Totals', PAGE_MARGIN, y);

  autoTable(doc, {
    startY: y + 10,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [['Calories', 'Protein', 'Fat', 'Carbohydrates', 'Fiber', 'Sodium']],
    body: [[
      `${Math.round(totals.calories)} kcal`,
      `${totals.protein} g`,
      `${totals.fat} g`,
      `${totals.carbohydrates} g`,
      `${totals.fiber} g`,
      `${Math.round(totals.sodium)} mg`,
    ]],
    styles: { fontSize: 9, textColor: INK, cellPadding: 8, halign: 'center' },
    headStyles: { fillColor: BRAND_GREEN, textColor: 255, fontStyle: 'bold', halign: 'center' },
    theme: 'grid',
    tableWidth: pageWidth - PAGE_MARGIN * 2,
  });

  return doc.lastAutoTable.finalY + 20;
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.line(PAGE_MARGIN, pageHeight - 50, pageWidth - PAGE_MARGIN, pageHeight - 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      'Generated by an AI prediction model. The glucose estimate is a model output, not a lab result or medical\n' +
        'diagnosis — for informational purposes only, not medical advice.',
      PAGE_MARGIN,
      pageHeight - 40,
      { maxWidth: pageWidth - PAGE_MARGIN * 2 - 60 }
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - 34, { align: 'right' });
  }
}

/**
 * Builds and downloads a PDF report for a prediction. `refs.probabilityChart`
 * and `refs.calorieChart` are optional React refs to DOM nodes captured as
 * chart images — missing ones are silently skipped rather than breaking
 * the report.
 */
export async function downloadPredictionReportPdf({ dietLabel, results, refs = {} }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const generatedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const label = DIET_LABELS[dietLabel] || dietLabel;
  let y = addHeader(doc, { dietLabel: label, generatedAt });

  const topConfidence = Math.max(...results.dietProbabilities.map((d) => d.probability));

  y = addMetricsRow(doc, y, [
    { label: 'BMI', value: results.bmi },
    { label: 'Confidence', value: `${topConfidence}%` },
    { label: 'Daily Calories', value: Math.round(results.nutritionTotals.calories) },
    { label: 'Est. Glucose (mg/dL)', value: results.metabolicScore },
  ]);

  y = await addChartImage(doc, y, refs.probabilityChart, 'Diet Fit Confidence');

  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 220) {
    doc.addPage();
    y = 50;
  }
  y = await addChartImage(doc, y, refs.calorieChart, 'Calories by Meal');

  if (y > pageHeight - 200) {
    doc.addPage();
    y = 50;
  }
  y = addMealPlanTable(doc, y, results.mealPlan);

  if (y > pageHeight - 140) {
    doc.addPage();
    y = 50;
  }
  addNutritionSummary(doc, y, results.nutritionTotals);

  addFooter(doc);

  const filenameSafeDiet = label.replace(/[^a-z0-9]+/gi, '-');
  doc.save(`NutriPredict-Report-${filenameSafeDiet}-${Date.now()}.pdf`);
}
