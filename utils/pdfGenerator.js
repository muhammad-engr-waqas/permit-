const QRCode = require("qrcode");
const { permitTemplate } = require("../templates/permitTemplate");

/**
 * Generates a permit PDF (Buffer).
 * - Vercel (production) : @sparticuz/chromium + puppeteer-core
 * - Local (development) : full puppeteer with system Chrome
 */
async function generatePermitPdf(permit) {
  const baseUrl  = process.env.BASE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify/${permit._id}`;

  // 1. QR code as base64 PNG
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 300 });

  // 2. Permit HTML
  const html = permitTemplate(permit, qrDataUrl);

  // 3. Launch browser
  let browser;
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    const chromium   = require("@sparticuz/chromium");
    const puppeteer  = require("puppeteer-core");

    // chromium.args already includes --no-sandbox etc.
    browser = await puppeteer.launch({
      args:            [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath:  await chromium.executablePath(),
      headless:        chromium.headless,
      ignoreHTTPSErrors: true,
    });
  } else {
    // Local — use system Chrome (Windows path or override via env)
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
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { generatePermitPdf };
