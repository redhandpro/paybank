function showStep(stepId) {
  // مخفی کردن همه مراحل
  document.querySelectorAll(".step").forEach((step) => {
    step.classList.remove("active");
  });

  // نمایش مرحله موردنظر
  document.getElementById(stepId).classList.add("active");
}

function nextStep(stepNumber) {
  showStep("step" + stepNumber);
}

function showPhone() {
  showStep("phoneStep");
}

function finish() {
  const phone = document.getElementById("phone").value.trim();

  if (!phone) {
    alert("اول یه شماره وارد کن 😄");
    return;
  }

  showStep("successStep");

  document.getElementById("result").innerHTML =
    اوکی 😄❤️<br>
     حالا راه ارتباطی رو خودت با رضایت وارد کردی.;
}

// دکمه خیر فرار می‌کند 😈
document.addEventListener("DOMContentLoaded", () => {
  const noBtn = document.getElementById("noBtn");

  if (noBtn) {
    noBtn.addEventListener("mouseenter", () => {
      const x = Math.random() * 150 - 75;
      const y = Math.random() * 80 - 40;

      noBtn.style.transform = translate(${x}px, ${y}px);
    });
  }
});
