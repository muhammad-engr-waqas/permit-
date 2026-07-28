// PDF is now generated client-side via browser print dialog (print.html)
// This file is kept for compatibility but not used in production.
async function generatePermitPdf() {
  throw new Error("Use client-side print page instead: /print/:id");
}
module.exports = { generatePermitPdf };
