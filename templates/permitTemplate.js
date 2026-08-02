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
  @page { size: A4 portrait; margin: 0; }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    /* FIX 3: Tahoma/Arial supports both Arabic & Latin glyphs with consistent visual weight */
    font-family: Tahoma, Arial, "Segoe UI", sans-serif;
    background: #fff;
    color: #000;
    font-size: 10.5px;
    line-height: 1.4;
  }
  .page {
    width: 88%;
    margin: 0 auto;
    padding: 40px 0;
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
    padding: 8px 14px;
    margin-bottom: 15px;
    direction: ltr;
  }
  .header-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100px;
    flex-shrink: 0;
  }
  .header-left img {
    width: 70px;
    height: 70px;
    display: block;
  }
  .header-left .code-text {
    font-size: 10px;
    font-weight: 700;
    margin-top: 4px;
    letter-spacing: 0.5px;
    color: #1a1a1a;
  }

  .header-center {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    color: #000;
    text-align: center;
    flex-grow: 1;
    padding: 0 15px;
    direction: rtl;
  }

  .header-right {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-shrink: 0;
    direction: ltr;
  }
  .logo-ajeer {
    height: 36px;
    width: auto;
  }
  .logo-ministry {
    height: 40px;
    width: auto;
  }

  /* ── NOTICE TEXT ── */
  .notice-text {
    font-size: 11px;
    line-height: 1.95;
    text-align: justify;
    margin-bottom: 15px;
    color: #111;
    direction: rtl;
  }

  /* ── TABLES ── */
  table.permit-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 10.5px;
    direction: rtl;
  }
  table.permit-table th {
    background: #ECF0F0;
    border: 1px solid #D7D7D7;
    text-align: center;
    font-weight: 700;
    font-size: 12px;
    padding: 6px 10px;
    color: #000000;
  }
  table.permit-table td {
    border: 1px solid #D7D7D7;
    padding: 6px 10px;
    /* FIX 2: auto height — cell expands with content, no fixed height */
    vertical-align: middle;
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
    height: auto;
  }
  .lbl-col {
    width: 25%;
    background: #ECF0F0;
    font-weight: normal;
    color: #000000;
    font-size: 10.5px;
    text-align: right;
    line-height: 1.35;
    /* FIX 3: same font stack as body */
    font-family: Tahoma, Arial, "Segoe UI", sans-serif;
  }
  .val-col {
    width: 25%;
    background: #fff;
    font-weight: normal;
    color: #000000;
    font-size: 10.5px;
    /* FIX 1: Always RTL + right-aligned so English names stay consistent with Arabic RTL table */
    direction: rtl;
    text-align: right;
    line-height: 1.35;
    /* FIX 3: same font stack handles both Arabic & Latin glyphs */
    font-family: Tahoma, Arial, "Segoe UI", sans-serif;
  }

  /* ── DECLARATIONS ── */
  .declarations {
    margin-top: 15px;
    direction: rtl;
  }
  .decl-main-title {
    font-size: 12.5px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 12px;
    color: #000;
  }
  .decl-sub-title {
    font-size: 10.5px;
    font-weight: bold;
    margin-bottom: 8px;
    color: #1a1a1a;
  }
  .decl-list {
    list-style: none;
    padding-right: 0;
    line-height: 2.05;
    font-size: 10.5px;
    color: #111;
  }
  .decl-list li {
    margin-bottom: 5px;
    position: relative;
    padding-right: 14px;
    text-align: justify;
  }
  .decl-list li::before {
    content: "•";
    position: absolute;
    right: 0;
    top: 0;
    font-size: 13px;
  }

  /* ── FOOTER ── */
  .page-footer {
    margin-top: auto;
    text-align: center;
    font-size: 10px;
    color: #333;
    direction: rtl;
    line-height: 1.85;
    padding-top: 20px;
  }
  .page-footer .approved-text {
    font-weight: normal;
    margin-top: 2px;
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
