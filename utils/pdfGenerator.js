// PDF is now generated client-side via html2pdf.js in print.html
// Puppeteer is NOT required.
async function generatePermitPdf() {
  throw new Error("Use client-side html2pdf.js in /print/:id instead.");
}
module.exports = { generatePermitPdf };
