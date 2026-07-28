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
