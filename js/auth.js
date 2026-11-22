
/* ========================================
   NUVIO - AUTHENTICATION SYSTEM
======================================== */

(function () {
    'use strict';

    const cloud = window.NuvioCloud;

    if (!cloud || !cloud.client) {
        console.error('Nuvio Auth: Supabase client is not available.');
        return;
    }

    const supabase = cloud.client;

    const screen = document.createElement('section');
    screen.id = 'nuvio-auth-screen';
    screen.hidden = true;

    screen.innerHTML = `
        <div class="nuvio-auth-orb nuvio-auth-orb-one"></div>
        <div class="nuvio-auth-orb nuvio-auth-orb-two"></div>
        <div class="nuvio-auth-shell">
            <aside class="nuvio-auth-showcase">
                <div class="nuvio-auth-brand">
                    <span class="nuvio-auth-brand-mark">N</span>
                    <span>NUVIO</span>
                </div>
                <div class="nuvio-auth-showcase-copy">
                    <span class="nuvio-auth-kicker">مساحتك للتركيز والإنتاجية</span>
                    <h1>رتّب يومك،<br>وحقّق أهدافك.</h1>
                    <p>مهام، عادات، وتركيز في مساحة واحدة هادئة وسريعة.</p>
                </div>
                <div class="nuvio-auth-preview" aria-hidden="true">
                    <div class="nuvio-auth-preview-bar"></div>
                    <div class="nuvio-auth-preview-row"><span></span><i></i></div>
                    <div class="nuvio-auth-preview-row short"><span></span><i></i></div>
                    <div class="nuvio-auth-preview-row"><span></span><i></i></div>
                </div>
            </aside>

            <div class="nuvio-auth-card">
                <div class="nuvio-auth-mobile-brand">
                    <span class="nuvio-auth-brand-mark">N</span>
                    <span>NUVIO</span>
                </div>
                <div class="nuvio-auth-heading">
                    <span class="nuvio-auth-heading-icon"><i class="fas fa-lock"></i></span>
                    <h2 id="nuvio-auth-title">تسجيل الدخول</h2>
                    <p id="nuvio-auth-subtitle">أهلاً بعودتك، سجّل دخولك للمتابعة</p>
                </div>

                <form id="nuvio-auth-form">
                    <div class="nuvio-auth-field">
                        <label for="nuvio-auth-email">البريد الإلكتروني</label>
                        <div class="nuvio-auth-input-wrap">
                            <i class="fas fa-envelope"></i>
                            <input id="nuvio-auth-email" type="email" autocomplete="email" placeholder="name@example.com" required>
                        </div>
                    </div>

                    <div class="nuvio-auth-field">
                        <label for="nuvio-auth-password">كلمة المرور</label>
                        <div class="nuvio-auth-input-wrap">
                            <i class="fas fa-lock"></i>
                            <input id="nuvio-auth-password" type="password" autocomplete="current-password" placeholder="••••••••" minlength="6" required>
                        </div>
                    </div>

                    <button class="nuvio-auth-primary" id="nuvio-auth-submit" type="submit">
                        <span>تسجيل الدخول</span>
                        <i class="fas fa-arrow-left"></i>
                    </button>
                </form>

                <div class="nuvio-auth-links">
                    <button type="button" id="nuvio-auth-reset">نسيت كلمة المرور؟</button>
                    <button type="button" id="nuvio-auth-switch">إنشاء حساب جديد</button>
                </div>
                <div id="nuvio-auth-message" role="status"></div>
            </div>
        </div>
    `;

    document.body.appendChild(screen);

    const form = screen.querySelector('#nuvio-auth-form');
    const title = screen.querySelector('#nuvio-auth-title');
    const emailInput = screen.querySelector('#nuvio-auth-email');
    const emailField = emailInput.closest('.nuvio-auth-field');
    const passwordInput = screen.querySelector('#nuvio-auth-password');
    const resetLinks = screen.querySelector('.nuvio-auth-links');
    const submitButton = screen.querySelector('#nuvio-auth-submit');
    const switchButton = screen.querySelector('#nuvio-auth-switch');
    const resetButton = screen.querySelector('#nuvio-auth-reset');
    const message = screen.querySelector('#nuvio-auth-message');

    let mode = 'login';

    function isEnglish() {
        return window.app?.settings?.language === 'en';
    }

    function authText(ar, en) {
        return isEnglish() ? en : ar;
    }

    function showMessage(text, success = false) {
        message.textContent = text;
        message.style.color = success ? '#86efac' : '#fca5a5';
    }

    function renderModeText() {
        const isRecovery = mode === 'recovery';
        const arrow = isEnglish() ? 'fa-arrow-right' : 'fa-arrow-left';
        screen.dir = isEnglish() ? 'ltr' : 'rtl';
        emailField.hidden = isRecovery;
        emailInput.required = !isRecovery;
        resetLinks.hidden = isRecovery;
        screen.querySelector('.nuvio-auth-kicker').textContent = authText('مساحتك للتركيز والإنتاجية', 'Your space for focus and productivity');
        screen.querySelector('.nuvio-auth-showcase-copy h1').innerHTML = isEnglish()
            ? 'Organize your day,<br>reach your goals.'
            : 'رتّب يومك،<br>وحقّق أهدافك.';
        screen.querySelector('.nuvio-auth-showcase-copy p').textContent = authText(
            'مهام، عادات، وتركيز في مساحة واحدة هادئة وسريعة.',
            'Tasks, habits, and focus in one calm, fast workspace.'
        );
        emailField.querySelector('label').textContent = authText('البريد الإلكتروني', 'Email address');
        passwordInput.closest('.nuvio-auth-field').querySelector('label').textContent = authText('كلمة المرور', 'Password');
        screen.querySelector('#nuvio-auth-subtitle').textContent = mode === 'login'
            ? authText('أهلاً بعودتك، سجّل دخولك للمتابعة', 'Welcome back. Sign in to continue.')
            : mode === 'recovery'
                ? authText('اختر كلمة مرور جديدة لحسابك', 'Choose a new password for your account.')
                : authText('أنشئ حسابك وابدأ تنظيم يومك', 'Create an account and start organizing your day.');

        if (mode === 'login') {
            title.textContent = authText('تسجيل الدخول', 'Sign in');
            submitButton.innerHTML = `<span>${authText('تسجيل الدخول', 'Sign in')}</span><i class="fas ${arrow}"></i>`;
            switchButton.textContent = authText('إنشاء حساب جديد', 'Create an account');
            resetButton.textContent = authText('نسيت كلمة المرور؟', 'Forgot password?');
            passwordInput.autocomplete = 'current-password';
        } else if (mode === 'recovery') {
            title.textContent = authText('تعيين كلمة مرور جديدة', 'Set a new password');
            submitButton.innerHTML = `<span>${authText('حفظ كلمة المرور', 'Save password')}</span><i class="fas ${arrow}"></i>`;
            switchButton.textContent = authText('العودة لتسجيل الدخول', 'Back to sign in');
            passwordInput.autocomplete = 'new-password';
        } else {
            title.textContent = authText('إنشاء حساب جديد', 'Create an account');
            submitButton.innerHTML = `<span>${authText('إنشاء الحساب', 'Create account')}</span><i class="fas ${arrow}"></i>`;
            switchButton.textContent = authText('لديك حساب بالفعل؟ تسجيل الدخول', 'Already have an account? Sign in');
            resetButton.textContent = authText('نسيت كلمة المرور؟', 'Forgot password?');
            passwordInput.autocomplete = 'new-password';
        }
    }

    function setMode(nextMode) {
        mode = nextMode;
        message.textContent = '';
        passwordInput.value = '';
        renderModeText();
    }

    switchButton.addEventListener('click', function () {
        setMode(mode === 'login' ? 'signup' : 'login');
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (password.length < 6) {
            showMessage(authText('كلمة المرور يجب ألا تقل عن 6 أحرف.', 'Password must be at least 6 characters.'));
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML = `<span>${authText('جارٍ التنفيذ...', 'Working...')}</span>`;
        showMessage('');

        try {
            if (mode === 'recovery') {
                const { error } = await supabase.auth.updateUser({ password });
                if (error) throw error;
                showMessage(authText('تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.', 'Password updated. You can now sign in.'), true);
                screen.hidden = true;
            } else if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin +
                            window.location.pathname
                    }
                });

                if (error) throw error;

                if (data.session) {
                    showMessage(authText('تم إنشاء الحساب بنجاح.', 'Account created successfully.'), true);
                    screen.hidden = true;
                } else {
                    showMessage(
                        authText('تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيده.', 'Account created. Check your email to confirm it.'),
                        true
                    );
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                showMessage(authText('تم تسجيل الدخول بنجاح.', 'Signed in successfully.'), true);
                screen.hidden = true;
            }
        } catch (error) {
            console.error('Nuvio Auth:', error);

            const errors = {
                'Invalid login credentials': authText('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'Email or password is incorrect.'),
                'User already registered': authText('هذا البريد مسجل بالفعل. سجّل الدخول.', 'This email is already registered. Sign in instead.'),
                'Email not confirmed': authText('يجب تأكيد البريد الإلكتروني أولًا.', 'Confirm your email address first.')
            };

            showMessage(
                errors[error.message] ||
                error.message ||
                authText('حدث خطأ. حاول مرة أخرى.', 'Something went wrong. Please try again.')
            );
        } finally {
            submitButton.disabled = false;
            renderModeText();
        }
    });

    resetButton.addEventListener('click', async function () {
        const email = emailInput.value.trim();

        if (!email) {
            showMessage(authText('اكتب بريدك الإلكتروني أولًا.', 'Enter your email address first.'));
            emailInput.focus();
            return;
        }

        resetButton.disabled = true;

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: window.location.origin +
                        window.location.pathname
                }
            );

            if (error) throw error;

            showMessage(
                authText('إذا كان البريد مسجلًا، ستصلك رسالة لاستعادة كلمة المرور.', 'If the email is registered, you will receive a password reset message.'),
                true
            );
        } catch (error) {
            console.error(error);
            showMessage(authText('تعذر إرسال رسالة الاستعادة. حاول لاحقًا.', 'Could not send the reset email. Please try again later.'));
        } finally {
            resetButton.disabled = false;
        }
    });

    async function initializeAuth() {
        screen.hidden = true;
        showMessage('');

        try {
            const { data, error } = await supabase.auth.getSession();

            if (error) throw error;

            if (data.session) {
                screen.hidden = true;
                window.app?.checkWelcomeScreen?.();
            } else {
                screen.hidden = true;
                window.app?.checkWelcomeScreen?.();
            }
        } catch (error) {
            console.error(error);
            screen.hidden = true;
            window.app?.checkWelcomeScreen?.();
        }
    }

    supabase.auth.onAuthStateChange(function (event, session) {
        window.app?.updateAccountSettings?.(session);
        if (event === 'PASSWORD_RECOVERY') {
            screen.hidden = false;
            document.getElementById('welcomeScreen')?.classList.add('hidden');
            setMode('recovery');
            showMessage(authText('أدخل كلمة المرور الجديدة لحسابك.', 'Enter a new password for your account.'));
        } else if (session) {
            screen.hidden = true;
            window.app?.checkWelcomeScreen?.();
        } else if (event === 'SIGNED_OUT') {
            screen.hidden = true;
        }
    });

    window.NuvioAuth = {
        signOut: async function () {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        },

        showLogin: function () {
            setMode('login');
            screen.hidden = false;
            document.getElementById('welcomeScreen')?.classList.add('hidden');
            showMessage(window.app?.settings?.language === 'en'
                ? 'Sign in or create an account to continue.'
                : 'سجّل الدخول أو أنشئ حسابًا للمتابعة.');
            emailInput.focus();
        },

        applyLanguage: function () {
            screen.dir = isEnglish() ? 'ltr' : 'rtl';
            renderModeText();
        },

        getUser: cloud.getUser,
        getSession: cloud.getSession
    };

    initializeAuth();
})();
