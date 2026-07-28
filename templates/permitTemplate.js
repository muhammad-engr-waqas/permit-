/**
 * Builds the HTML string that Puppeteer will convert into the final PDF.
 * Layout matches print.html exactly:
 *   LEFT  → QR code with black border
 *   CENTER → "إشعار أجير حلول الموارد البشرية"
 *   RIGHT  → Ajeer logo + Ministry inline SVG logo
 *
 * @param {Object} permit    - Mongoose permit document (plain object)
 * @param {String} qrDataUrl - base64 PNG data URL of the generated QR code
 * @param {String} ajeerLogoBase64 - base64 data URL of /ajeer-new-logo-copy.png
 */
function formatDate(d) {
  const date = new Date(d);
  return date.toISOString().split("T")[0];
}

function permitTemplate(permit, qrDataUrl, ajeerLogoBase64) {
  // Fallback: if no base64 logo provided, use relative path (may not work in Puppeteer)
  const ajeerLogoSrc = ajeerLogoBase64 || "/ajeer-new-logo-copy.png";

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>إشعار أجير - ${permit._id}</title>
<style>
  @page { size: A4; margin: 28px 32px; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
    background: #fff;
    color: #1a1a1a;
    font-size: 11px;
  }

  /* ── HEADER BOX ── */
  .header-box {
    border: 1px solid #999;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    margin-bottom: 16px;
    height: 235px;
    direction: ltr;
  }

  /* QR on the LEFT */
  .qr-wrap-left {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 215px;
    height: 215px;
    flex-shrink: 0;
  }
  .qr-wrap-left img {
    width: 215px;
    height: 215px;
    display: block;
    border: 3px solid #000;
  }

  /* Title in CENTER */
  .header-title-center {
    font-size: 19px;
    font-weight: 700;
    color: #1a1a1a;
    text-align: center;
    line-height: 1.6;
    flex-grow: 1;
    direction: rtl;
  }

  /* Logos on the RIGHT */
  .header-logos-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 18px;
    flex-shrink: 0;
    direction: ltr;
  }
  .logo-ajeer-img {
    height: 52px;
    width: auto;
  }
  .logo-ministry-img {
    height: 60px;
    width: auto;
    flex-shrink: 0;
  }

  /* ── INTRO TEXT ── */
  .intro {
    font-size: 11px;
    line-height: 2.1;
    text-align: justify;
    margin-bottom: 12px;
    color: #1a1a1a;
    direction: rtl;
    border: 1px solid #ddd;
    padding: 8px 12px;
    background: #fafafa;
  }

  /* ── TABLES ── */
  table.permit-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 7px;
    font-size: 10.5px;
    direction: rtl;
  }
  table.permit-table .table-header td {
    background: #fff;
    border: 1px solid #777;
    text-align: center;
    font-weight: 700;
    font-size: 11.5px;
    padding: 5px 8px;
    color: #1a1a1a;
  }
  table.permit-table td {
    border: 1px solid #aaa;
    padding: 7px 10px;
    vertical-align: top;
  }
  .cell-label {
    font-size: 9px;
    color: #555;
    margin-bottom: 3px;
    line-height: 1.5;
    direction: rtl;
  }
  .cell-label .ar { display: block; font-weight: 600; }
  .cell-label .en { display: block; color: #777; }
  .cell-value {
    font-weight: 700;
    font-size: 11px;
    color: #1a1a1a;
  }

  /* ── DECLARATIONS ── */
  .declarations {
    border: 1px solid #aaa;
    padding: 8px 12px;
    margin-top: 10px;
    direction: rtl;
    font-size: 10.5px;
  }
  .decl-main-title {
    font-weight: 700;
    font-size: 13px;
    text-align: center;
    margin-bottom: 4px;
  }
  .decl-sub-title {
    font-weight: 600;
    margin-bottom: 6px;
    font-size: 10.5px;
  }
  .decl-list {
    padding-inline-start: 18px;
    line-height: 1.85;
  }
  .decl-list li { margin-bottom: 2px; }

  /* ── FOOTER ── */
  .page-footer {
    text-align: center;
    font-size: 10px;
    color: #444;
    margin-top: 14px;
    border-top: 1px solid #ccc;
    padding-top: 6px;
    direction: rtl;
  }
</style>
</head>
<body>

  <!-- ════════════ HEADER BOX ════════════ -->
  <div class="header-box">

    <!-- QR — LEFT -->
    <div class="qr-wrap-left">
      <img src="${qrDataUrl}" alt="QR Code" />
    </div>

    <!-- Title — CENTER -->
    <div class="header-title-center">إشعار أجير حلول الموارد<br/>البشرية</div>

    <!-- Logos — RIGHT -->
    <div class="header-logos-right">

      <!-- Ajeer Logo -->
      <img class="logo-ajeer-img" src="${ajeerLogoSrc}" alt="Ajeer Logo" />

      <!-- Ministry Logo Image -->
      <img class="logo-ministry-img" src="/Saudi Arabia launches Hajj Ajeer service for Seasonal employment of Hajj - Saudi-Expatriates.com.jpg" alt="Ministry Logo" />

    </div>

  </div>

  <!-- ════════════ INTRO ════════════ -->
  <div class="intro">
    نشعركم أنه تم التعاقد من قبلنا كجهة مقدمة للخدمة مع الجهة المستفيدة من الخدمة حسب المعلومات المبينة أدناه،
    ولذلك تم تسجيل معلومات العقد لتكون بحوزة العامل لإثبات عدم مخالفته لنظام العمل ولتقديمها إلى من يهمه الأمر
    من الجهات المختصة عند طلبها للتحقق من صحة تواجده في مكان تقديم الخدمة.
  </div>

  <!-- ════════════ LABORER TABLE ════════════ -->
  <table class="permit-table">
    <tr class="table-header"><td colspan="3">بيانات العامل &nbsp; Laborer Information</td></tr>
    <tr>
      <td>
        <div class="cell-label"><span class="ar">اسم العامل</span><span class="en">Laborer Name</span></div>
        <div class="cell-value">${permit.laborerNameEn || ''}</div>
      </td>
      <td>
        <div class="cell-label"><span class="ar">المهنة</span><span class="en">Occupation</span></div>
        <div class="cell-value">${permit.occupationEn || ''}</div>
      </td>
      <td>
        <div class="cell-label"><span class="ar">الجنسية</span><span class="en">Nationality</span></div>
        <div class="cell-value">${permit.nationalityEn || ''}</div>
      </td>
    </tr>
    <tr>
      <td colspan="3">
        <div class="cell-label"><span class="ar">رقم الهوية / الإقامة</span><span class="en">ID Number</span></div>
        <div class="cell-value">${permit.idNumber || ''}</div>
      </td>
    </tr>
  </table>

  <!-- ════════════ PROVIDER TABLE ════════════ -->
  <table class="permit-table">
    <tr class="table-header"><td colspan="2">بيانات مقدم الخدمة &nbsp; Provider Information</td></tr>
    <tr>
      <td style="width:65%">
        <div class="cell-label"><span class="ar">المنشأة المقدمة للخدمة</span><span class="en">Provider Establishment</span></div>
        <div class="cell-value">${permit.providerNameEn || ''}${permit.providerNameAr ? '<br/>' + permit.providerNameAr : ''}</div>
      </td>
      <td>
        <div class="cell-label"><span class="ar">رقم المنشأة في وزارة الموارد البشرية والتنمية الاجتماعية</span><span class="en">Establishment Number</span></div>
        <div class="cell-value">${permit.providerEstablishmentNumber || ''}</div>
      </td>
    </tr>
  </table>

  <!-- ════════════ BENEFICIARY TABLE ════════════ -->
  <table class="permit-table">
    <tr class="table-header"><td colspan="2">بيانات المستفيد من الخدمة &nbsp; Beneficiary Information</td></tr>
    <tr>
      <td style="width:65%">
        <div class="cell-label"><span class="ar">المنشأة المستفيدة من الخدمة</span><span class="en">Beneficiary Establishment</span></div>
        <div class="cell-value">${permit.beneficiaryNameEn || ''}${permit.beneficiaryNameAr ? '<br/>' + permit.beneficiaryNameAr : ''}</div>
      </td>
      <td>
        <div class="cell-label"><span class="ar">رقم المنشأة في وزارة الموارد البشرية والتنمية الاجتماعية</span><span class="en">Establishment Number</span></div>
        <div class="cell-value">${permit.beneficiaryEstablishmentNumber || ''}</div>
      </td>
    </tr>
  </table>

  <!-- ════════════ PERMIT DATES TABLE ════════════ -->
  <table class="permit-table">
    <tr class="table-header"><td colspan="2">بيانات التصريح &nbsp; Permit Information</td></tr>
    <tr>
      <td>
        <div class="cell-label"><span class="ar">تاريخ بداية التصريح</span><span class="en">Permit Start Date</span></div>
        <div class="cell-value">${formatDate(permit.permitStartDate)}</div>
      </td>
      <td>
        <div class="cell-label"><span class="ar">تاريخ نهاية التصريح</span><span class="en">Permit End Date</span></div>
        <div class="cell-value">${formatDate(permit.permitEndDate)}</div>
      </td>
    </tr>
  </table>

  <!-- ════════════ DECLARATIONS ════════════ -->
  <div class="declarations">
    <div class="decl-main-title">إقرارات</div>
    <div class="decl-sub-title">أقر أنا المنشأة المقدمة للخدمة والموضحة بأعلى وأتعهد بـ:</div>
    <ul class="decl-list">
      <li>إن العامل حامل هذا التصريح يقر ويتعهد بأن البيانات المدونة فيه صحيحة على مسؤوليته الشخصية، وأنه يعمل لدى المنشأة ولحسابها بموجب رخصة إقامة سارية المفعول.</li>
      <li>الالتزام والتقيد بأنظمة العمل والعمال والأفراد والأحوال الشخصية وأي أنظمة ولوائح وقرارات أخرى ذات علاقة.</li>
      <li>إن الموقع الإلكتروني الخاص بأجير حلول الموارد البشرية متاح من قِبله أو القائمين عليه للتحقق مما هو وارد بهذا التصريح.</li>
      <li>إن إلزام أصحاب الأعمال أو غيرهم على التعامل مع المنشأة فقط وبدون أي إلزام قانون أو غيره على التعامل مع موقع أجير.</li>
      <li>أي تعديل أو كشط في هذا التصريح يجعله لاغياً.</li>
    </ul>
  </div>

  <!-- ════════════ FOOTER ════════════ -->
  <div class="page-footer">"خدمة مقدمة من وزارة الموارد البشرية والتنمية الاجتماعية"</div>

</body>
</html>
`;
}

module.exports = { permitTemplate, formatDate };
