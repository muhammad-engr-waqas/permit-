const form = document.getElementById("permitForm");
const statusMsg = document.getElementById("statusMsg");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusMsg.textContent = "";
  statusMsg.className = "";
  submitBtn.disabled = true;
  submitBtn.textContent = "جاري الإنشاء... / Generating...";

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const res = await fetch("/api/permits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to generate PDF");
    }

    // Download the returned PDF
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "permit.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    statusMsg.textContent = "تم إنشاء التصريح بنجاح! / Permit generated successfully!";
    statusMsg.className = "success";
    form.reset();
  } catch (err) {
    statusMsg.textContent = "خطأ: " + err.message;
    statusMsg.className = "error";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "إنشاء وتنزيل PDF / Generate & Download PDF";
  }
});
