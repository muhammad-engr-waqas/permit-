const form      = document.getElementById("permitForm");
const statusMsg = document.getElementById("statusMsg");
const submitBtn = document.getElementById("submitBtn");
const btnText   = document.getElementById("btnText");
const spinner   = document.getElementById("spinner");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusMsg.textContent = "";
  statusMsg.className   = "status-msg";
  submitBtn.disabled    = true;
  btnText.textContent   = "جاري الإنشاء... / Generating...";
  spinner.classList.add("show");

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const res = await fetch("/api/permits", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to create permit");

    // Redirect same page to print — no popup blocker issue
    window.location.href = `/print/${json.id}`;

  } catch (err) {
    statusMsg.textContent = "✘ خطأ: " + err.message;
    statusMsg.classList.add("error");
    submitBtn.disabled  = false;
    btnText.textContent = "إنشاء وتنزيل PDF / Generate & Download PDF";
    spinner.classList.remove("show");
  }
});
