const PDFDocument = require("pdfkit");
const QRCode      = require("qrcode");

/**
 * Generates a permit PDF Buffer using PDFKit (no Chrome/browser needed).
 * Works on Vercel, local, anywhere.
 */
async function generatePermitPdf(permit) {
  const baseUrl   = process.env.BASE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify/${permit._id}`;

  // 1. QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 200 });

  // 2. Format date helper
  const fmt = (d) => new Date(d).toISOString().split("T")[0];

  // 3. Build PDF
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ size: "A4", margin: 40, rtl: false });
    const chunks = [];

    doc.on("data",  (c) => chunks.push(c));
    doc.on("end",   ()  => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 80; // usable width

    // ── Colors & fonts ──────────────────────────────────────────
    const GREEN  = "#0f766e";
    const GRAY   = "#6b7280";
    const BLACK  = "#1f2937";
    const WHITE  = "#ffffff";

    // ── HEADER ──────────────────────────────────────────────────
    // QR code (top-left)
    doc.image(qrBuffer, 40, 40, { width: 90, height: 90 });

    // Brand (top-right)
    doc.font("Helvetica-Bold").fontSize(13).fillColor(GREEN)
       .text("Naas Human Resources Solutions", 0, 48, { align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor(GRAY)
       .text("شركة ناس للموارد البشرية", 0, 65, { align: "right" });

    // Divider
    doc.moveTo(40, 138).lineTo(555, 138).strokeColor(GREEN).lineWidth(2).stroke();

    // ── TITLE ───────────────────────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(15).fillColor(GREEN)
       .text("HR Solutions Permit Notice", 40, 150, { align: "center", width: W });

    let y = 178;

    // ── TABLE helper ────────────────────────────────────────────
    function sectionHeader(title, yPos) {
      doc.rect(40, yPos, W, 22).fill(GREEN);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(WHITE)
         .text(title, 44, yPos + 5, { width: W - 8 });
      return yPos + 22;
    }

    function row(label, value, yPos, colX, colW) {
      doc.rect(colX, yPos, colW, 38).stroke(GRAY).lineWidth(0.5);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(BLACK)
         .text(value || "—", colX + 6, yPos + 5, { width: colW - 12, ellipsis: true });
      doc.font("Helvetica").fontSize(9).fillColor(GRAY)
         .text(label, colX + 6, yPos + 20, { width: colW - 12 });
    }

    // ── LABORER INFO ────────────────────────────────────────────
    y = sectionHeader("Laborer Information  /  بيانات العامل", y);

    const col3 = W / 3;
    row("Laborer Name / اسم العامل",    permit.laborerNameEn,  y, 40,           col3);
    row("Occupation / المهنة",          permit.occupationEn,   y, 40 + col3,    col3);
    row("Nationality / الجنسية",        permit.nationalityEn,  y, 40 + col3*2,  col3);
    y += 38;

    row("ID / Iqama / رقم الهوية",      permit.idNumber,       y, 40, W);
    y += 38 + 12;

    // ── PROVIDER INFO ───────────────────────────────────────────
    y = sectionHeader("Istiqdam Company  /  مقدم الخدمة", y);

    const col2 = W / 2;
    row("Establishment Name",          permit.providerNameEn,              y, 40,        col2);
    row("Establishment Number / رقم",  permit.providerEstablishmentNumber, y, 40 + col2, col2);
    y += 38 + 12;

    // ── BENEFICIARY INFO ────────────────────────────────────────
    y = sectionHeader("Beneficiary Company  /  المستفيد من الخدمة", y);

    row("Establishment Name",          permit.beneficiaryNameEn,              y, 40,        col2);
    row("Establishment Number / رقم",  permit.beneficiaryEstablishmentNumber, y, 40 + col2, col2);
    y += 38 + 12;

    // ── PERMIT DATES ────────────────────────────────────────────
    y = sectionHeader("Permit Information  /  بيانات التصريح", y);

    const col3b = W / 3;
    row("Permit ID / رقم التصريح",        String(permit._id),              y, 40,             col3b);
    row("Start Date / تاريخ البداية",     fmt(permit.permitStartDate),     y, 40 + col3b,     col3b);
    row("Expiry Date / تاريخ الانتهاء",   fmt(permit.permitEndDate),       y, 40 + col3b * 2, col3b);
    y += 38 + 16;

    // ── DECLARATIONS ────────────────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(11).fillColor(GREEN)
       .text("Declarations / إقرارات", 40, y);
    y += 16;

    const declarations = [
      "The laborer confirms that all information in this permit is accurate and that they are working for the establishment under a valid residency permit.",
      "Compliance with labor regulations, rules, and any related decisions is required.",
      "Any alteration or erasure to this permit renders it void.",
    ];

    declarations.forEach((d) => {
      doc.font("Helvetica").fontSize(9.5).fillColor(BLACK)
         .text(`• ${d}`, 44, y, { width: W - 8, align: "left" });
      y += 24;
    });

    // ── FOOTER ──────────────────────────────────────────────────
    doc.moveTo(40, 790).lineTo(555, 790).strokeColor("#e5e7eb").lineWidth(1).stroke();
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
       .text(
         "Scan the QR code to verify this permit online.  |  امسح رمز الاستجابة السريعة للتحقق إلكترونياً",
         40, 796, { align: "center", width: W }
       );

    doc.end();
  });
}

module.exports = { generatePermitPdf };
