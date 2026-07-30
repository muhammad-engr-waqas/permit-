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
