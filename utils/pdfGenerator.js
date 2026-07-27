const QRCode   = require("qrcode");
const htmlPdf  = require("html-pdf-node");
const { permitTemplate } = require("../templates/permitTemplate");

/**
 * Generates a permit PDF Buffer using html-pdf-node.
 * Works on both local and Vercel (no Chrome binary needed).
 */
async function generatePermitPdf(permit) {
  const baseUrl   = process.env.BASE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify/${permit._id}`;

  // 1. QR code → base64 PNG
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 300 });

  // 2. Build HTML
  const html = permitTemplate(permit, qrDataUrl);

  // 3. Render HTML → PDF
  const file    = { content: html };
  const options = {
    format: "A4",
    printBackground: true,
    margin: { top: "28px", right: "34px", bottom: "28px", left: "34px" },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

  const pdfBuffer = await htmlPdf.generatePdf(file, options);
  return pdfBuffer;
}

module.exports = { generatePermitPdf };
