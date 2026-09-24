const form             = document.getElementById("permitForm");
const statusMsg        = document.getElementById("statusMsg");
const submitBtn        = document.getElementById("submitBtn");
const btnText          = document.getElementById("btnText");
const spinner          = document.getElementById("spinner");
const personsContainer = document.getElementById("personsContainer");
const btnAddPerson     = document.getElementById("btnAddPerson");
const personCountText  = document.getElementById("personCountText");
const totalPriceText   = document.getElementById("totalPriceText");
const template         = document.getElementById("personTemplate");

const PRICE_PER_PERSON = 22.35;

/* ══════════════════════════════════════════════
   AUTHENTICATION & LOGOUT HANDLING
══════════════════════════════════════════════ */
const authToken = null;
const authUsername = "admin";

const userNameDisplay = document.getElementById("userNameDisplay");
if (userNameDisplay) {
  userNameDisplay.textContent = authUsername;
}

const btnLogout = document.getElementById("btnLogout");


// Auth disabled — no login required


/* ══════════════════════════════════════════════
   AUTO-TRANSLATE: English → Arabic
══════════════════════════════════════════════ */
const translatePairs = [
  ["laborerNameEn",     "laborerNameAr"],
  ["occupationEn",      "occupationAr"],
  ["nationalityEn",     "nationalityAr"],
  ["providerNameEn",    "providerNameAr"],
  ["beneficiaryNameEn", "beneficiaryNameAr"],
];

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function translateToArabic(text) {
  if (!text || !text.trim()) return "";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=en|ar`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.responseStatus === 200) {
      return data.responseData.translatedText || "";
    }
  } catch (err) {}
  return "";
}

function wireTranslateForBlock(block) {
  translatePairs.forEach(([enName, arName]) => {
    const enInput = block.querySelector(`[name="${enName}"]`);
    const arInput = block.querySelector(`[name="${arName}"]`);
    if (!enInput || !arInput) return;

    let hint = arInput.parentNode.querySelector(".translate-hint");
    if (!hint) {
      hint = document.createElement("span");
      hint.className = "translate-hint";
      hint.style.cssText = "font-size:11px;color:#0f766e;display:none;margin-top:2px;";
      arInput.parentNode.appendChild(hint);
    }

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
    }, 700);

    enInput.addEventListener("input", (e) => {
      doTranslate(e.target.value);
    });
  });
}

function wireArabicGuardForBlock(block) {
  const enNameInput = block.querySelector('[name="laborerNameEn"]');
  if (!enNameInput) return;

  let warn = enNameInput.parentNode.querySelector(".arabic-warn");
  if (!warn) {
    warn = document.createElement("div");
    warn.className = "arabic-warn";
    warn.style.cssText = "display:none;background:#fff3cd;border:1px solid #ffc107;color:#856404;padding:6px 10px;border-radius:4px;font-size:12px;margin-top:4px;";
    warn.innerHTML = "⚠️ <strong>يرجى كتابة الاسم بالحروف اللاتينية فقط</strong> — هذا الحقل يظهر في PDF<br><small>Please type in English/Latin letters only (e.g. WAQAS ALI)</small>";
    enNameInput.parentNode.appendChild(warn);
  }

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
}

/* ══════════════════════════════════════════════
   MULTI-PERSON MANAGEMENT
══════════════════════════════════════════════ */
function updatePersonHeaders() {
  const blocks = personsContainer.querySelectorAll(".person-block");
  const count = blocks.length;

  blocks.forEach((block, index) => {
    block.dataset.personIndex = index;
    const header = block.querySelector(".person-header");
    const title  = block.querySelector(".person-header-title");
    if (count > 1) {
      header.style.display = "flex";
      title.textContent = `شخص ${index + 1} / Person ${index + 1}`;
    } else {
      header.style.display = "none";
    }
  });

  const total = count * PRICE_PER_PERSON;
  personCountText.textContent = count;
  totalPriceText.textContent = `SAR ${total.toFixed(2)}`;
  btnText.textContent = `إنشاء وتنزيل PDF / Generate & Download PDF — SAR ${total.toFixed(2)}`;
}

function addPersonBlock() {
  const clone = template.content.cloneNode(true);
  const block = clone.querySelector(".person-block");

  // Wire remove button
  const removeBtn = block.querySelector(".btn-remove-person");
  removeBtn.addEventListener("click", () => {
    if (personsContainer.querySelectorAll(".person-block").length > 1) {
      block.remove();
      updatePersonHeaders();
    }
  });

  wireTranslateForBlock(block);
  wireArabicGuardForBlock(block);

  personsContainer.appendChild(block);
  updatePersonHeaders();
  return block;
}

btnAddPerson.addEventListener("click", () => {
  const newBlock = addPersonBlock();
  newBlock.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Initialize with Person 1
addPersonBlock();

/* ══════════════════════════════════════════════
   FORM SUBMIT → CREATE ORDER & REDIRECT TO PAYMENT
══════════════════════════════════════════════ */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  statusMsg.textContent = "";
  statusMsg.className   = "status-msg";
  submitBtn.disabled    = true;
  if (spinner) spinner.style.display = "inline";

  const blocks = personsContainer.querySelectorAll(".person-block");
  const personsPayload = [];

  const requiredFields = [
    "laborerNameEn", "occupationEn", "nationalityEn", "idNumber",
    "providerNameAr", "providerEstablishmentNumber",
    "beneficiaryNameAr", "beneficiaryEstablishmentNumber",
    "permitStartDate", "permitEndDate"
  ];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const inputs = block.querySelectorAll("input");
    const formData = {};

    inputs.forEach(input => {
      formData[input.name] = input.value ? input.value.trim() : "";
    });

    // Check missing fields
    const missing = requiredFields.filter(f => !formData[f] || formData[f] === "");
    if (missing.length > 0) {
      statusMsg.textContent = `✘ بيانات غير مكتملة في شخص ${i + 1} / Missing required fields in Person ${i + 1}`;
      statusMsg.className   = "status-msg error";
      submitBtn.disabled    = false;
      if (spinner) spinner.style.display = "none";
      block.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    personsPayload.push({
      personNumber: i + 1,
      formData: formData,
    });
  }

  btnText.textContent = "جاري التحويل لصفحة الدفع... / Redirecting to Payment...";

  try {
    const res = await fetch("/api/orders", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + (localStorage.getItem("auth_token") || "")
      },
      body:    JSON.stringify({ persons: personsPayload }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Server error: " + res.status);

    localStorage.setItem("lastOrderId", json.orderId);

    // Redirect to Payment Processing page
    window.location.href = "/payment-processing.html?orderId=" + json.orderId;

  } catch (err) {
    console.error("Order creation error:", err);
    statusMsg.textContent = "✘ " + err.message;
    statusMsg.className   = "status-msg error";
    submitBtn.disabled    = false;
    if (spinner) spinner.style.display = "none";
    updatePersonHeaders();
  }
});
