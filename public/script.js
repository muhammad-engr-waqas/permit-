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

  // Debug: log what we're sending
  console.log("Sending data:", data);

  try {
    const res = await fetch("/api/permits", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });

    // Try to parse response regardless of status
    let json;
    try { json = await res.json(); } catch(e) { json = {}; }

    console.log("Response status:", res.status, "Body:", json);

    if (!res.ok) throw new Error(json.error || `Server error: ${res.status}`);

    // Success — redirect to print page
    window.location.href = `/print/${json.id}`;

  } catch (err) {
    console.error("Submit error:", err);
    statusMsg.textContent = "✘ Error: " + err.message;
    statusMsg.classList.add("error");
    submitBtn.disabled  = false;
    btnText.textContent = "إنشاء وتنزيل PDF / Generate & Download PDF";
    spinner.classList.remove("show");
  }
});
