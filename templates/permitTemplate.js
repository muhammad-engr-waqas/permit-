/**
 * Builds the HTML string that Puppeteer will convert into the final PDF.
 * Layout is modeled on the sample "Ajeer" permit notice: QR top-left,
 * logo top-right, bilingual (Arabic/English) info table, declarations at the bottom.
 *
 * @param {Object} permit  - Mongoose permit document (plain object)
 * @param {String} qrDataUrl - base64 PNG data URL of the generated QR code
 */
function formatDate(d) {
  const date = new Date(d);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD, same as the sample
}

function permitTemplate(permit, qrDataUrl) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<style>
  @page { size: A4; margin: 28px 34px; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
    color: #1f2937;
    font-size: 12px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #0f766e;
    padding-bottom: 14px;
    margin-bottom: 18px;
  }
  .qr-box img { width: 110px; height: 110px; }
  .brand {
    text-align: left;
    max-width: 300px;
  }
  .brand-title { font-size: 15px; font-weight: 700; color: #0f766e; }
  .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }

  .notice-title {
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    margin: 6px 0 16px;
    color: #0f766e;
  }
  .intro {
    font-size: 11.5px;
    line-height: 1.9;
    text-align: justify;
    margin-bottom: 18px;
  }

  table.info {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
  }
  table.info caption {
    background: #0f766e;
    color: #fff;
    font-weight: 700;
    padding: 6px 10px;
    text-align: center;
    font-size: 12.5px;
  }
  table.info td {
    border: 1px solid #d1d5db;
    padding: 8px 10px;
    vertical-align: top;
    width: 33.33%;
  }
  table.info td .val { font-weight: 700; font-size: 12.5px; }
  table.info td .lbl { font-size: 10.5px; color: #6b7280; margin-top: 3px; }

  .declarations {
    margin-top: 20px;
    font-size: 11px;
  }
  .declarations h3 {
    font-size: 12.5px;
    color: #0f766e;
    margin-bottom: 8px;
  }
  .declarations ul { padding-inline-start: 18px; line-height: 1.8; }

  .footer {
    margin-top: 24px;
    text-align: center;
    font-size: 10px;
    color: #9ca3af;
    border-top: 1px solid #e5e7eb;
    padding-top: 8px;
  }
</style>
</head>
<body>

  <div class="header">
    <div class="qr-box">
      <img src="${qrDataUrl}" alt="QR Code" />
    </div>
    <div class="brand">
      <div class="brand-title">شركة ناس للموارد البشرية</div>
      <div class="brand-sub">Naas Human Resources Solutions</div>
    </div>
  </div>

  <div class="notice-title">إشعار تصريح حلول الموارد البشرية</div>

  <div class="intro">
    نشعركم أنه تم التعاقد من قبلنا كجهة مقدمة للخدمة مع الجهة المستفيدة من الخدمة حسب المعلومات المبينة أدناه،
    ولذلك تم تسجيل معلومات العقد لتكون بحوزة العامل لإثبات عدم مخالفته لنظام العمل ولتقديمها إلى من يهمه الأمر
    من الجهات المختصة عند طلبها للتحقق من صحة تواجده في مكان تقديم الخدمة.
  </div>

  <table class="info">
    <caption>بيانات العامل &nbsp;/&nbsp; Laborer Information</caption>
    <tr>
      <td><div class="val">${permit.occupationEn}</div><div class="lbl">Occupation / المهنة</div></td>
      <td><div class="val">${permit.laborerNameEn}</div><div class="lbl">Laborer Name / اسم العامل</div></td>
      <td><div class="val">${permit.nationalityEn}</div><div class="lbl">Nationality / الجنسية</div></td>
    </tr>
    <tr>
      <td colspan="3"><div class="val">${permit.idNumber}</div><div class="lbl">ID / Iqama Number / رقم الهوية - الإقامة</div></td>
    </tr>
  </table>

  <table class="info">
    <caption>بيانات مقدم الخدمة &nbsp;/&nbsp; Provider Information</caption>
    <tr>
      <td><div class="val">${permit.providerEstablishmentNumber}</div><div class="lbl">Establishment Number / رقم المنشأة</div></td>
      <td colspan="2"><div class="val">${permit.providerNameEn}</div><div class="lbl">Provider Establishment / المنشأة المقدمة للخدمة</div></td>
    </tr>
  </table>

  <table class="info">
    <caption>بيانات المستفيد من الخدمة &nbsp;/&nbsp; Beneficiary Information</caption>
    <tr>
      <td><div class="val">${permit.beneficiaryEstablishmentNumber}</div><div class="lbl">Establishment Number / رقم المنشأة</div></td>
      <td colspan="2"><div class="val">${permit.beneficiaryNameEn}</div><div class="lbl">Beneficiary Establishment / المنشأة المستفيدة</div></td>
    </tr>
  </table>

  <table class="info">
    <caption>بيانات التصريح &nbsp;/&nbsp; Permit Information</caption>
    <tr>
      <td><div class="val">${formatDate(permit.permitEndDate)}</div><div class="lbl">Permit End Date / تاريخ نهاية التصريح</div></td>
      <td><div class="val">${formatDate(permit.permitStartDate)}</div><div class="lbl">Permit Start Date / تاريخ بداية التصريح</div></td>
      <td><div class="val">${permit._id}</div><div class="lbl">Permit ID / رقم التصريح</div></td>
    </tr>
  </table>

  <div class="declarations">
    <h3>إقرارات / Declarations</h3>
    <ul>
      <li>إن العامل حامل هذا التصريح يقر ويتعهد بأن البيانات المدونة فيه صحيحة على مسؤوليته الشخصية، وأنه يعمل لدى المنشأة ولحسابها بموجب رخصة إقامة سارية المفعول.</li>
      <li>الالتزام والتقيد بأنظمة العمل والعمال وأي أنظمة ولوائح وقرارات أخرى ذات علاقة.</li>
      <li>أي تعديل أو كشط في هذا التصريح يجعله لاغياً.</li>
    </ul>
  </div>

  <div class="footer">
    امسح رمز الاستجابة السريعة أعلاه للتحقق من صحة هذا التصريح إلكترونياً — Scan the QR code above to verify this permit online.
  </div>

</body>
</html>
`;
}

module.exports = { permitTemplate, formatDate };
