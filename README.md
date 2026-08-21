<!-- Form -->
        <form class="login-form" id="loginForm" novalidate>
            <!-- Username -->
            <div class="input-group">
                <input type="text" id="username" placeholder="نام کاربری یا ایمیل" required autocomplete="username" />
                <span class="icon"><i class="fas fa-envelope"></i></span>
            </div>

            <!-- Password -->
            <div class="input-group">
                <input type="password" id="password" placeholder="رمز عبور" required autocomplete="current-password" />
                <span class="icon"><i class="fas fa-lock"></i></span>
                <button type="button" class="toggle-password" id="togglePassword" aria-label="نمایش رمز عبور">
                    <i class="fas fa-eye"></i>
                </button>
            </div>

            <!-- Options -->
            <div class="form-options">
                <label>
                    <input type="checkbox" checked />
                    مرا به خاطر بسپار
                </label>
                <a href="#">رمز عبور را فراموش کردید؟</a>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn-submit">
                <span>ورود</span>
                <i class="fas fa-arrow-left"></i>
            </button>
        </form>

        <!-- Footer -->
        <div class="login-footer">
            حساب کاربری ندارید؟ <a href="#">ثبت نام کنید</a>
        </div>
    </div>

    <script>
        // ---------- Toggle password visibility ----------
        const toggleBtn = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');

        toggleBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });

        // ---------- Form submission (demo) ----------
        const form = document.getElementById('loginForm');

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            // Simple validation
            if (!username || !password) {
                // Shake animation on the card
                const card = document.querySelector('.login-card');
                card.classList.add('shake');
                setTimeout(() => card.classList.remove('shake'), 500);

                // Change button text briefly to show error
                const btn = this.querySelector('.btn-submit');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span>لطفاً همه فیلدها را پر کنید</span>';
                btn.style.background = 'linear-gradient(135deg, #f97373, #f55555)';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                }, 1800);
                return;
            }

            // Success simulation
            const btn = this.querySelector('.btn-submit');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span><i class="fas fa-spinner fa-spin"></i> در حال ورود...</span>';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = '<span><i class="fas fa-check-circle"></i> موفق!</span>';
                btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

                setTimeout(() => {
                    btn.innerHTML = originalText;
