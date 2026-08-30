let currentStep = 1;
let score = 0;
const totalQuestions = 4;

// تابع پاسخ به سوالات
function answerQuestion(step, answer) {
    // اضافه کردن امتیاز اگر پاسخ "بله" باشه
    if (answer) {
        score++;
    }

    // اگر سوال آخر نباشه، بریم به مرحله بعد
    if (step < totalQuestions) {
        // مخفی کردن مرحله فعلی
        document.getElementById(`step${step}`).classList.add('hidden');
        
        // نمایش مرحله بعدی با تاخیر
        setTimeout(() => {
            document.getElementById(`step${step + 1}`).classList.remove('hidden');
        }, 500);
    } else {
        // اگر سوال آخر بود، بریم به صفحه نهایی
        document.getElementById(`step${step}`).classList.add('hidden');
        
        setTimeout(() => {
            showFinalScore();
        }, 500);
    }
}

// نمایش امتیاز نهایی
function showFinalScore() {
    const finalStep = document.getElementById('finalStep');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const scoreMessage = document.getElementById('scoreMessage');
    
    // نمایش امتیاز
    scoreDisplay.textContent = score;
    
    // پیام بر اساس امتیاز
    let message = '';
    let emoji = '';
    
    if (score === 4) {
        message = '💖  منتظر پیامت هستم 😊';
        emoji = '🌟';
    } else if (score === 3) {
        message = '💕 خیلی خوب! خوشحالم که اینقدر موافق بودی! 😍';
        emoji = '🥰';
    } else if (score === 2) {
        message = '❤️ خوبه! ولی حیف که به همه نگفتی بله! 😅';
        emoji = '😊';
    } else if (score === 1) {
        message = '💔 اوه! فقط یک بله! امیدوارم بازم ببینمت! 😅';
        emoji = '🤗';
    } else {
        message = '😢 وای! هیچ کدوم رو بله نگفتی! ولی بازم دوستت دارم! ❤️';
        emoji = '💕';
    }
    
    scoreMessage.textContent = `${emoji} ${message}`;
    
    // نمایش صفحه نهایی
    finalStep.classList.remove('hidden');
    
    // تغییر رنگ کارت بر اساس امتیاز
    const card = document.querySelector('.doodle-card-front');
    if (score === 4) {
        card.style.boxShadow = '0 40px 80px rgba(233, 30, 99, 0.6), 0 0 60px rgba(233, 30, 99, 0.2)';
    } else if (score >= 3) {
        card.style.boxShadow = '0 40px 80px rgba(233, 30, 99, 0.4)';
    }
}
