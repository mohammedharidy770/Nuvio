
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

            <main class="nuvio-auth-card">
                <div class="nuvio-auth-mobile-brand">
                    <span class="nuvio-auth-brand-mark">N</span>
                    <span>NUVIO</span>
                </div>
                <div class="nuvio-auth-heading">
                    <span class="nuvio-auth-heading-icon"><i class="fas fa-lock"></i></span>
                    <h2 id="nuvio-auth-title">تسجيل الدخول</h2>
                    <p>أهلاً بعودتك، سجّل دخولك للمتابعة</p>
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
            </main>
        </div>
    `;

    document.body.appendChild(screen);

    const form = screen.querySelector('#nuvio-auth-form');
    const title = screen.querySelector('#nuvio-auth-title');
    const emailInput = screen.querySelector('#nuvio-auth-email');
    const passwordInput = screen.querySelector('#nuvio-auth-password');
    const submitButton = screen.querySelector('#nuvio-auth-submit');
    const switchButton = screen.querySelector('#nuvio-auth-switch');
    const resetButton = screen.querySelector('#nuvio-auth-reset');
    const message = screen.querySelector('#nuvio-auth-message');

    let mode = 'login';

    function showMessage(text, success = false) {
        message.textContent = text;
        message.style.color = success ? '#86efac' : '#fca5a5';
    }

    function setMode(nextMode) {
        mode = nextMode;
        message.textContent = '';

        if (mode === 'login') {
            title.textContent = 'تسجيل الدخول';
            submitButton.innerHTML = '<span>تسجيل الدخول</span><i class="fas fa-arrow-left"></i>';
            switchButton.textContent = 'إنشاء حساب جديد';
            passwordInput.autocomplete = 'current-password';
        } else {
            title.textContent = 'إنشاء حساب جديد';
            submitButton.innerHTML = '<span>إنشاء الحساب</span><i class="fas fa-arrow-left"></i>';
            switchButton.textContent = 'لديك حساب بالفعل؟ تسجيل الدخول';
            passwordInput.autocomplete = 'new-password';
        }
    }

    switchButton.addEventListener('click', function () {
        setMode(mode === 'login' ? 'signup' : 'login');
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (password.length < 6) {
            showMessage('كلمة المرور يجب ألا تقل عن 6 أحرف.');
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML = '<span>جارٍ التنفيذ...</span>';
        showMessage('');

        try {
            if (mode === 'signup') {
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
                    showMessage('تم إنشاء الحساب بنجاح.', true);
                    screen.hidden = true;
                } else {
                    showMessage(
                        'تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيده.',
                        true
                    );
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                showMessage('تم تسجيل الدخول بنجاح.', true);
                screen.hidden = true;
            }
        } catch (error) {
            console.error('Nuvio Auth:', error);

            const errors = {
                'Invalid login credentials':
                    'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
                'User already registered':
                    'هذا البريد مسجل بالفعل. سجّل الدخول.',
                'Email not confirmed':
                    'يجب تأكيد البريد الإلكتروني أولًا.'
            };

            showMessage(
                errors[error.message] ||
                error.message ||
                'حدث خطأ. حاول مرة أخرى.'
            );
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = mode === 'login'
                ? '<span>تسجيل الدخول</span><i class="fas fa-arrow-left"></i>'
                : '<span>إنشاء الحساب</span><i class="fas fa-arrow-left"></i>';
        }
    });

    resetButton.addEventListener('click', async function () {
        const email = emailInput.value.trim();

        if (!email) {
            showMessage('اكتب بريدك الإلكتروني أولًا.');
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
                'إذا كان البريد مسجلًا، ستصلك رسالة لاستعادة كلمة المرور.',
                true
            );
        } catch (error) {
            console.error(error);
            showMessage('تعذر إرسال رسالة الاستعادة. حاول لاحقًا.');
        } finally {
            resetButton.disabled = false;
        }
    });

    async function initializeAuth() {
        screen.hidden = false;
        showMessage('جارٍ التحقق من الحساب...');

        try {
            const { data, error } = await supabase.auth.getSession();

            if (error) throw error;

            if (data.session) {
                screen.hidden = true;
            } else {
                screen.hidden = false;
                showMessage('سجّل الدخول أو أنشئ حسابًا للمتابعة.');
            }
        } catch (error) {
            console.error(error);
            screen.hidden = false;
            showMessage('تعذر الاتصال. تحقق من الإنترنت وحاول مجددًا.');
        }
    }

    supabase.auth.onAuthStateChange(function (event, session) {
        if (session) {
            screen.hidden = true;
        } else if (event === 'SIGNED_OUT') {
            screen.hidden = false;
            setMode('login');
        }
    });

    window.NuvioAuth = {
        signOut: async function () {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        },

        getUser: cloud.getUser,
        getSession: cloud.getSession
    };

    initializeAuth();
})();
