const QRCode = require("qrcode");
const { permitTemplate } = require("../templates/permitTemplate");

/**
 * Generates a permit PDF (Buffer) for the given permit document.
 * - On Vercel (production): uses @sparticuz/chromium + puppeteer-core
 * - Locally: uses system Chrome via full puppeteer package
 */
async function generatePermitPdf(permit) {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify/${permit._id}`;

  // 1. Build QR code as a base64 PNG data URL
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 300,
  });

  // 2. Build the HTML for this permit
  const html = permitTemplate(permit, qrDataUrl);

  // 3. Launch browser — environment-aware
  let browser;
  const isVercel = process.env.VERCEL === "1";

  if (isVercel) {
    // Vercel serverless: use lightweight chromium
    const chromium = require("@sparticuz/chromium");
    const puppeteer = require("puppeteer-core");
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    // Local development: use system Chrome
    const puppeteer = require("puppeteer");
    browser = await puppeteer.launch({
      headless: "new",
      executablePath:
        process.env.CHROME_PATH ||
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { generatePermitPdf };
