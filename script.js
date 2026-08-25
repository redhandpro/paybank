function nextStep(stepNumber) {

  document
    .querySelector(".step.active")
    .classList
    .remove("active");

  document
    .getElementById(step${stepNumber})
    .classList
    .add("active");
}


function showPhone() {

  document
    .querySelector(".step.active")
    .classList
    .remove("active");

  document
    .getElementById("phoneStep")
    .classList
    .add("active");
}


function finish() {

  const phone =
    document
      .getElementById("phone")
      .value
      .trim();

  if (!phone) {
    alert("اول یه شماره وارد کن 😄");
    return;
  }

  document
    .querySelector(".step.active")
    .classList
    .remove("active");

  document
    .getElementById("successStep")
    .classList
    .add("active");

  document
    .getElementById("result")
    .innerHTML =
      شماره با رضایت خودت ثبت شد 😄❤️<br>
       حالا برنامه رسماً اجرا شد!;
}


/*
  دکمه خیر فرار می‌کند 😈
*/

const noBtn =
  document.getElementById("noBtn");

noBtn.addEventListener("mouseenter", () => {

  const x =
    Math.random() * 200 - 100;

  const y =
    Math.random() * 100 - 50;

  noBtn.style.transform =
    translate(${x}px, ${y}px);

});
