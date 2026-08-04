/**
 * Builds the HTML string that Puppeteer or server render will convert into the permit document.
 * Layout matches print.html (Official Ajeer Permit - تصريح أجير - الإعارة).
 *
 * @param {Object} permit    - Mongoose permit document (plain object)
 * @param {String} qrDataUrl - base64 PNG data URL of the generated QR code
 * @param {String} ajeerLogoBase64 - base64 data URL of /ajeer-new-logo-copy.png
 */
function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().split("T")[0];
}

function permitTemplate(permit, qrDataUrl, ajeerLogoBase64) {
  const ajeerLogoSrc = ajeerLogoBase64 || "/ajeer-new-logo-copy.png";
  const permitCode = permit.permitCode || "TW6617332";

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>تصريح أجير - الإعارة - ${permit._id}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm 22mm;
    /* Hide browser print headers (URL, date/time) */
    @top-left { content: none; display: none; }
    @top-center { content: none; display: none; }
    @top-right { content: none; display: none; }
    @bottom-left { content: none; display: none; }
    @bottom-center { content: none; display: none; }
    @bottom-right { content: none; display: none; }
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: "Frutiger", "Frutiger LT Arabic", "Frutiger Next Arabic", Arial, Tahoma, "Segoe UI", sans-serif;
    background: #fff;
    color: #111;
    font-size: 12px;
    line-height: 1.5;
    font-weight: 400;
  }
  .page {
    width: 100%;
    margin: 0;
    padding: 0;
    min-height: 297mm;
    display: flex;
    flex-direction: column;
  }

  /* ── HEADER ── */
  .header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #D7D7D7;
    border-radius: 4px;
    padding: 4px 12px;
    margin-bottom: 14px;
    direction: ltr;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .header-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 90px;
    flex-shrink: 0;
  }
  .header-left img {
    width: 52px;
    height: 52px;
    display: block;
    object-fit: contain;
  }
  .header-left .code-text {
    font-size: 10px;
    font-weight: 400;
    margin-top: 2px;
    letter-spacing: 0.5px;
    color: #222;
  }

  .header-center {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    color: #000;
    text-align: center;
    flex-grow: 1;
    padding: 0 10px;
    direction: rtl;
  }

  .header-right {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-shrink: 0;
    direction: ltr;
  }
  .logo-ajeer {
    height: 48px;
    width: auto;
    object-fit: contain;
  }
  .logo-ministry {
    height: 48px;
    width: auto;
    object-fit: contain;
  }

  /* ── NOTICE TEXT ── */
  .notice-text {
    font-size: 12px;
    line-height: 1.85;
    font-weight: 400;
    text-align: justify;
    margin-bottom: 20px;
    color: #222;
    direction: rtl;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* ── TABLES ── */
  table.permit-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 12px;
    direction: rtl;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  table.permit-table th {
    background: #F2F5F5;
    border: 1px solid #D7D7D7;
    text-align: center;
    font-weight: 600;
    font-size: 13px;
    padding: 8px 12px;
    color: #111;
  }
  table.permit-table td {
    border: 1px solid #D7D7D7;
    padding: 7px 12px;
    vertical-align: middle;
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    height: auto;
    font-weight: 400;
  }
  .lbl-col {
    width: 25%;
    background: #F2F5F5;
    font-weight: 400;
    color: #222;
    font-size: 11.5px;
    text-align: right;
    line-height: 1.4;
    font-family: "Frutiger", "Frutiger LT Arabic", "Frutiger Next Arabic", Arial, Tahoma, "Segoe UI", sans-serif;
  }
  .val-col {
    width: 25%;
    background: #fff;
    font-weight: 400;
    color: #111;
    font-size: 11.5px;
    direction: rtl;
    text-align: right;
    line-height: 1.4;
    font-family: "Frutiger", "Frutiger LT Arabic", "Frutiger Next Arabic", Arial, Tahoma, "Segoe UI", sans-serif;
  }

  /* ── DECLARATIONS ── */
  .declarations {
    margin-top: 10px;
    direction: rtl;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .decl-main-title {
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 12px;
    color: #000;
  }
  .decl-sub-title {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #222;
  }
  .decl-list {
    list-style: none;
    padding-right: 0;
    line-height: 1.95;
    font-size: 11.5px;
    font-weight: 400;
    color: #222;
  }
  .decl-list li {
    margin-bottom: 6px;
    position: relative;
    padding-right: 16px;
    text-align: justify;
    font-weight: 400;
  }
  .decl-list li::before {
    content: "•";
    position: absolute;
    right: 0;
    top: 0;
    font-size: 15px;
    color: #444;
  }

  /* ── FOOTER ── */
  .page-footer {
    margin-top: auto;
    text-align: center;
    font-size: 11px;
    font-weight: 400;
    color: #444;
    direction: rtl;
    line-height: 1.8;
    padding-top: 25px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .page-footer .approved-text {
    font-weight: 400;
    margin-top: 3px;
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header-container">
    <div class="header-left">
      <img src="${qrDataUrl}" alt="QR Code" />
      <div class="code-text">${permitCode}</div>
    </div>
    <div class="header-center">تصريح أجير - الإعارة</div>
    <div class="header-right">
      <img class="logo-ajeer" src="${ajeerLogoSrc}" alt="Ajeer Logo" />
      <img class="logo-ministry" src="/Saudi Arabia launches Hajj Ajeer service for Seasonal employment of Hajj - Saudi-Expatriates.com.jpg" alt="Ministry Logo" />
    </div>
  </div>

  <!-- NOTICE -->
  <div class="notice-text">
    نشعركم أنه تم التعاقد من قبلنا كجهة مقدمة للخدمة مع الجهة المستفيدة من الخدمة حسب المعلومات المبينة أدناه، ولذلك تم تسجيل معلومات العقد لتكون بحوزة العامل لإثبات عدم مخالفته لنظام العمل ولتقديمها إلى من يهمه الأمر من الجهات المختصة عند طلبها للتحقق من صحة تواجده في مكان تقديم الخدمة
  </div>

  <!-- UNIFIED PERMIT TABLE -->
  <table class="permit-table">
    <tbody>
      <!-- SECTION 1: Laborer Information -->
      <tr><th colspan="4">بيانات العامل</th></tr>
      <tr>
        <td class="lbl-col">اسم العامل</td>
        <td class="val-col">${permit.laborerNameEn || ''}</td>
        <td class="lbl-col">المهنة</td>
        <td class="val-col">${permit.occupationAr || permit.occupationEn || ''}</td>
      </tr>
      <tr>
        <td class="lbl-col">رقم الهوية / الإقامة</td>
        <td class="val-col">${permit.idNumber || ''}</td>
        <td class="lbl-col">الجنسية</td>
        <td class="val-col">${permit.nationalityAr || permit.nationalityEn || ''}</td>
      </tr>

      <!-- SECTION 2: Provider Information -->
      <tr><th colspan="4">بيانات مقدم الخدمة</th></tr>
      <tr>
        <td class="lbl-col">المنشأة المقدمة للخدمة</td>
        <td class="val-col">${permit.providerNameAr || ''}</td>
        <td class="lbl-col">رقم المنشأة في وزارة الموارد البشرية و التنمية الإجتماعية</td>
        <td class="val-col">${permit.providerEstablishmentNumber || ''}</td>
      </tr>

      <!-- SECTION 3: Beneficiary Information -->
      <tr><th colspan="4">بيانات المستفيد من الخدمة</th></tr>
      <tr>
        <td class="lbl-col">المنشأة المستفيدة من الخدمة</td>
        <td class="val-col">${permit.beneficiaryNameAr || ''}</td>
        <td class="lbl-col">رقم المنشأة في وزارة الموارد البشرية و التنمية الإجتماعية</td>
        <td class="val-col">${permit.beneficiaryEstablishmentNumber || ''}</td>
      </tr>

      <!-- SECTION 4: Permit Dates -->
      <tr><th colspan="4">بيانات التصريح</th></tr>
      <tr>
        <td class="lbl-col">تاريخ بداية التصريح</td>
        <td class="val-col">${formatDate(permit.permitStartDate)}</td>
        <td class="lbl-col">تاريخ نهاية التصريح</td>
        <td class="val-col">${formatDate(permit.permitEndDate)}</td>
      </tr>
    </tbody>
  </table>

  <!-- DECLARATIONS -->
  <div class="declarations">
    <div class="decl-main-title">إقرارات</div>
    <div class="decl-sub-title">أقر أنا المنشأة المقدمة للخدمة والموضحة بياناتي أعلاه وأتعهد بـ:</div>
    <ul class="decl-list">
      <li>إن العامل حامل هذا التصريح بحمله له يقر ويتعهد بأن البيانات المدونة فيه صحيحة على مسؤوليته الشخصية، وأنه يعمل لدى المنشأة ولحسابها، بموجب رخصة إقامة سارية المفعول. وأتحمل أي تبعات قانونية أو غرامات تترتب على خلاف المذكور أعلاه.</li>
      <li>أنه تم الحصول على موافقة الموظف لإعارة خدماته للمنشأة المستفيدة قبل إصدار التصريح.</li>
      <li>الالتزام والتقيد بأنظمة العمل والعمال وأي أنظمة و لوائح وقرارات أخرى ذات علاقة.</li>
      <li>أن الموقع الإلكتروني الخاص بأجير أو القائمين عليه عبارة عن وسيط إلكتروني ما بين الباحثين عن العمل وأصحاب الأعمال فقط وبدون أي التزام قانوني أو غيره على القائمين على موقع أجير.</li>
      <li>أي تعديل أو كشط في هذا التصريح يجعله لاغياً.</li>
    </ul>
  </div>

  <!-- FOOTER -->
  <div class="page-footer">
    <div class="link-text">للتحقق من صحة هذا التصريح وسريان مفعوله بإمكانك زيارة موقع أجير (https://ajeer.com.sa)</div>
    <div class="approved-text">* خدمة معتمدة من وزارة الموارد البشرية والتنمية الإجتماعية *</div>
  </div>

</div>
</body>
</html>
`;
}

module.exports = { permitTemplate, formatDate };
