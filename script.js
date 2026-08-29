let listHtml = '';
    questions.forEach((q, idx) => {
        const answerIndex = userAnswers[idx];
        const answerText = (answerIndex !== undefined) ? q.options[answerIndex] : '❌ پاسخ داده نشده';
        listHtml += 
            <li>
                <span class="question-label">${q.text}</span>
                <span class="answer-value">${answerText}</span>
            </li>
        ;
    });
    answersList.innerHTML = listHtml;

    // شماره تماس (که در HTML نوشته شده)
    // در صورت نیاز می‌توانید شماره را از اینجا تنظیم کنید
    // document.getElementById('myPhone').textContent = '۰۹۱۲ ۳۴۵ ۶۷۸۹';
}

// بازنشانی (شروع مجدد)
function restartQuiz() {
    currentIndex = 0;
    userAnswers = [];
    resultBox.classList.remove('show');
    quizBox.style.display = 'block';
    nextBtn.classList.remove('hidden');
    renderQuestion(0);
    // اسکرول به بالا
    document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
}

// ======== راه‌اندازی اولیه ========
renderQuestion(0);
