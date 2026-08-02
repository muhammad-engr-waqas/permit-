const form      = document.getElementById("permitForm");
const statusMsg = document.getElementById("statusMsg");
const submitBtn = document.getElementById("submitBtn");
const btnText   = document.getElementById("btnText");
const spinner   = document.getElementById("spinner");

/* ══════════════════════════════════════════════
   AUTO-TRANSLATE: English → Arabic
   Each En→Ar pair: [englishInputName, arabicInputName]
══════════════════════════════════════════════ */
const translatePairs = [
  ["laborerNameEn",               "laborerNameAr"],
  ["occupationEn",                "occupationAr"],
  ["nationalityEn",               "nationalityAr"],
  ["providerNameEn",              "providerNameAr"],
  ["beneficiaryNameEn",           "beneficiaryNameAr"],
];

// Debounce helper — waits `delay` ms after user stops typing
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Call MyMemory free translation API (no key needed)
async function translateToArabic(text) {
  if (!text || !text.trim()) return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=en|ar`;
  const res  = await fetch(url);
  const data = await res.json();
  if (data.responseStatus === 200) {
    return data.responseData.translatedText || "";
  }
  return "";
}

// Wire up each pair
translatePairs.forEach(([enName, arName]) => {
  const enInput = form.querySelector(`[name="${enName}"]`);
  const arInput = form.querySelector(`[name="${arName}"]`);
  if (!enInput || !arInput) return;

  // Create a small status label under the Arabic field
  const hint = document.createElement("span");
  hint.style.cssText = "font-size:11px;color:#0f766e;display:none;margin-top:2px;";
  arInput.parentNode.appendChild(hint);

  const doTranslate = debounce(async (value) => {
    if (!value.trim()) { arInput.value = ""; return; }
    hint.textContent = "⏳ Translating...";
    hint.style.display = "inline";
    arInput.style.borderColor = "#0f766e";
    try {
      const arabic = await translateToArabic(value);
      if (arabic) {
        arInput.value = arabic;
        arInput.style.direction = "rtl";
        hint.textContent = "✔ Auto-translated";
        setTimeout(() => { hint.style.display = "none"; }, 2000);
      } else {
        hint.textContent = "⚠ Could not translate";
        setTimeout(() => { hint.style.display = "none"; }, 2000);
      }
    } catch (err) {
      hint.textContent = "⚠ Translation failed";
      setTimeout(() => { hint.style.display = "none"; }, 2000);
    }
    arInput.style.borderColor = "";
  }, 700); // 700 ms after user stops typing

  enInput.addEventListener("input", (e) => {
    doTranslate(e.target.value);
  });
});

/* ══════════════════════════════════════════════
   ARABIC-IN-ENGLISH GUARD for اسم العامل
   If user types Arabic in the English name field,
   show a clear warning — PDF shows this field only.
══════════════════════════════════════════════ */
(function() {
  var enNameInput = form.querySelector('[name="laborerNameEn"]');
  if (!enNameInput) return;

  // Create warning element
  var warn = document.createElement("div");
  warn.style.cssText = "display:none;background:#fff3cd;border:1px solid #ffc107;color:#856404;padding:6px 10px;border-radius:4px;font-size:12px;margin-top:4px;";
  warn.innerHTML = "⚠️ <strong>يرجى كتابة الاسم بالحروف اللاتينية فقط</strong> — هذا الحقل يظهر في PDF<br><small>Please type in English/Latin letters only (e.g. WAQAS ALI)</small>";
  enNameInput.parentNode.appendChild(warn);

  function hasArabic(str) {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(str);
  }

  enNameInput.addEventListener("input", function() {
    if (hasArabic(this.value)) {
      warn.style.display = "block";
      this.style.borderColor = "#ffc107";
      this.style.background  = "#fffdf0";
    } else {
      warn.style.display = "none";
      this.style.borderColor = "";
      this.style.background  = "";
    }
  });
})();


/* ══════════════════════════════════════════════
   FORM SUBMIT
══════════════════════════════════════════════ */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  statusMsg.textContent = "";
  statusMsg.className   = "status-msg";
  submitBtn.disabled    = true;
  if (btnText) btnText.textContent = "جاري الإنشاء... / Generating...";
  if (spinner) spinner.style.display = "inline";

  const data = Object.fromEntries(new FormData(form).entries());
  console.log("Submitting:", data);

  try {
    const res  = await fetch("/api/permits", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });

    let json = {};
    try { json = await res.json(); } catch(e) {}
    console.log("Response:", res.status, json);

    if (!res.ok) throw new Error(json.error || "Server error: " + res.status);

    // Redirect to print page
    window.location.href = "/print/" + json.id;

  } catch (err) {
    console.error("Error:", err);
    statusMsg.textContent = "✘ " + err.message;
    statusMsg.className   = "status-msg error";
    submitBtn.disabled    = false;
    if (btnText) btnText.textContent = "إنشاء وتنزيل PDF / Generate & Download PDF";
    if (spinner) spinner.style.display = "none";
  }
});
