Object.assign(NuvioApp.prototype, {
    setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(item.dataset.section);
            });
        });

        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });

        document.getElementById('sidebarClose').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('active');
        });

        // Close the mobile navigation when the user taps outside it or presses Escape.
        document.addEventListener('click', (event) => {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            if (window.innerWidth <= 768 && sidebar?.classList.contains('active')
                && !sidebar.contains(event.target) && !menuToggle?.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                document.getElementById('sidebar')?.classList.remove('active');
            }
        });

        document.getElementById('btnNewTask').addEventListener('click', () => {
            this.openTaskModal();
        });

        document.getElementById('btnNotifications').addEventListener('click', () => {
            this.toggleNotifications();
        });

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('langToggle').addEventListener('click', () => {
            this.toggleLanguage();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderTasks();
            });
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setTimerMode(btn.dataset.mode);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTaskModal();
                this.closeTaskDetails();
                this.closeHabitModal();
            }
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.openTaskModal();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.saveData();
        });
    },

    applyTheme() {
        const isDark = this.settings.darkMode;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = isDark;
        const reminderToggle = document.getElementById('taskReminderEnabled');
        if (reminderToggle) reminderToggle.checked = this.settings.taskReminder !== false;

        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    },

    toggleTheme() {
        this.settings.darkMode = !this.settings.darkMode;
        this.applyTheme();
        this.saveData();
        this.showToast(this.settings.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
    },

    toggleDarkMode() {
        this.settings.darkMode = document.getElementById('darkModeToggle').checked;
        this.applyTheme();
        this.saveData();
    },

    toggleTaskReminder() {
        const toggle = document.getElementById('taskReminderEnabled');
        if (!toggle) return;
        this.settings.taskReminder = toggle.checked;
        this.saveData();
    },

    showSection(section) {
        this.currentSection = section;

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section + 'Section');
        });

        const titles = {
            dashboard: this.t('pages.dashboard'),
            tasks: this.t('pages.tasks'),
            focus: this.t('pages.focus'),
            calendar: this.t('pages.calendar'),
            reports: this.t('pages.reports'),
            ai: 'AI Nuvio',
            settings: this.t('pages.settings'),
            habits: this.t('nav.habits'),
            prayer: this.t('nav.prayer')
        };
        document.getElementById('pageTitle').textContent = titles[section] || 'Nuvio';

        document.getElementById('sidebar').classList.remove('active');

        if (section === 'tasks') this.renderTasks();
                if (section === 'sleep') this.renderSleep();
        if (section === 'water') this.renderWater();
        if (section === 'calendar') this.renderCalendar();
        if (section === 'reports') this.renderReports();
        if (section === 'dashboard') this.renderDashboard();
        if (section === 'habits') this.renderHabits();
                if (section === 'notes') this.renderNotes();
        if (section === 'prayer') { this.renderPrayerTimes(); this.updatePrayerCountdown(); }
        if (section === 'focus') {
            if (this.timerState.running && this.timerState.endAt) {
                this.timerState.timeLeft = Math.max(0, Math.ceil((this.timerState.endAt - Date.now()) / 1000));
            } else {
                this.restoreTimerState();
            }
            this.updateTimerDisplay();
            this.syncTimerButtons();
            this.renderFocusStats();
        }

        window.scrollTo(0, 0);
    },

    startClock() {
        setInterval(() => this.updateTime(), 1000);
    },

    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('currentTime').textContent = `${hours}:${minutes}`;

        const isAr = this.settings.language === 'ar';
        const locale = isAr ? 'ar-SA' : 'en-US';

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').textContent = now.toLocaleDateString(locale, options);
        document.getElementById('welcomeDate').textContent = `${this.t('dashboard.welcome')} — ${now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}`;
        document.getElementById('progressDate').textContent = now.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    },

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
        }
    },

    playNotificationSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.connect(gain);
            gain.connect(ctx.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    addNotification(type, message, time = null) {
        const notification = {
            id: 'notif-' + Date.now(),
            type,
            message,
            time: time ? time.toISOString() : new Date().toISOString(),
            read: false
        };

        this.notifications.unshift(notification);
        if (this.notifications.length > 50) this.notifications.pop();

        this.saveData();
        this.updateNotificationBadge();
    },

    toggleNotifications() {
        const panel = document.getElementById('notificationsPanel');
        if (panel) panel.classList.toggle('active');
        this.renderNotifications();
    },

    renderNotifications() {
        const list = document.getElementById('notificationsList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">' + (this.settings.language === 'ar' ? 'لا توجد إشعارات' : 'No notifications') + '</p>';
            return;
        }

        const icons = { task: 'fa-tasks', focus: 'fa-clock', reminder: 'fa-bell' };

        const escapeHTML = window.NuvioSecurity.escapeHTML;
        list.innerHTML = this.notifications.map(n => `
            <div class="notification-item ${n.read ? '' : 'unread'}" onclick="app.markNotificationRead('${window.NuvioSecurity.safeId(n.id)}')">
                <div class="notification-icon ${n.type}">
                    <i class="fas ${icons[n.type] || 'fa-bell'}"></i>
                </div>
                <div class="notification-content">
                    <p>${escapeHTML(n.message)}</p>
                    <span>${new Date(n.time).toLocaleString(this.settings.language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                </div>
            </div>
        `).join('');
    },

    markNotificationRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.read = true;
        this.saveData();
        this.updateNotificationBadge();
        this.renderNotifications();
    },

    clearNotifications() {
        this.notifications = [];
        this.saveData();
        this.updateNotificationBadge();
        this.renderNotifications();
    },

    updateNotificationBadge() {
        const unread = this.notifications.filter(n => !n.read).length;
        const dot = document.getElementById('notificationDot');
        if (dot) dot.classList.toggle('active', unread > 0);
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const escapeHTML = window.NuvioSecurity.escapeHTML;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${icons[type] || 'fa-info-circle'}"></i></div>
            <div class="toast-content"><p>${escapeHTML(message)}</p></div>
            <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    checkOverdueTasks() {
        const now = new Date();
        this.tasks.forEach(task => {
            if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed') {
                // Overdue tasks are visually marked in renderTaskItem
            }
        });
    },

    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            this.showToast(this.settings.language === 'ar' ? 'الصورة كبيرة جداً (أقصى 2 ميجا)' : 'Image too large (max 2MB)', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.userProfile.avatar = e.target.result;
            this.updateAvatarPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    },

    updateAvatarPreview(imageData) {
        const preview = document.getElementById('avatarPreview');
        if (!preview) return;
        
        preview.innerHTML = `<img src="${imageData}" alt="avatar">`;
        preview.classList.add('has-image');
    },

    applyUserProfile() {
        // Update sidebar
        const nameEl = document.getElementById('sidebarUserName');
        const avatarEl = document.getElementById('sidebarAvatar');
        
        if (nameEl && this.userProfile.name) {
            nameEl.textContent = this.userProfile.name;
        }
        
        if (avatarEl && this.userProfile.avatar) {
            avatarEl.innerHTML = `<img src="${this.userProfile.avatar}" alt="${this.userProfile.name}">`;
        }
    },

    checkWelcomeScreen() {
        const screen = document.getElementById('welcomeScreen');
        if (!screen) return;

        if (this.userProfile.name) {
            screen.classList.add('hidden');
            this.applyUserProfile();
        } else {
            screen.classList.remove('hidden');
        }
    },

    hideWelcomeScreen() {
        const screen = document.getElementById('welcomeScreen');
        if (screen) {
            screen.classList.add('hidden');
            setTimeout(() => {
                screen.style.zIndex = '';
            }, 500);
        }
    },

        editUserProfile() {
        const nameInput = document.getElementById('userNameInput');
        const preview = document.getElementById('avatarPreview');
        const sub = document.getElementById('welcomeSubtitle');
        
        if (nameInput) nameInput.value = this.userProfile.name || '';
        
        if (preview) {
            if (this.userProfile.avatar) {
                preview.innerHTML = `<img src="${this.userProfile.avatar}" alt="avatar">`;
                preview.classList.add('has-image');
            } else {
                preview.innerHTML = '<i class="fas fa-user"></i>';
                preview.classList.remove('has-image');
            }
        }
        
        if (sub) sub.textContent = this.t('welcome.editTitle');
        
        const screen = document.getElementById('welcomeScreen');
        if (screen) {
            screen.classList.remove('hidden');
            screen.style.zIndex = '6000';
        }
    },

    showHelp() {
        this.helpStep = 0;
        this.buildHelpSteps();
        this.renderHelpStep();
        const modal = document.getElementById('helpModal');
        const overlay = document.getElementById('helpModalOverlay');
        if (modal) modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeHelp() {
        const modal = document.getElementById('helpModal');
        const overlay = document.getElementById('helpModalOverlay');
        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
        localStorage.setItem('nuvio_help_seen', 'true');
    },

    buildHelpSteps() {
        this.helpSteps = [
            {
                icon: 'fa-rocket',
                title: this.t('help.welcomeTitle'),
                desc: this.t('help.welcomeDesc'),
                features: [
                    { icon: 'fa-tasks', text: this.t('help.feature1') },
                    { icon: 'fa-clock', text: this.t('help.feature2') },
                    { icon: 'fa-spa', text: this.t('help.feature3') },
                    { icon: 'fa-mosque', text: this.t('help.feature4') },
                    { icon: 'fa-sticky-note', text: this.t('help.feature7') },
                    { icon: 'fa-bed', text: this.t('help.feature8') },
                    { icon: 'fa-tint', text: this.t('help.feature9') },
                    { icon: 'fa-chart-bar', text: this.t('help.feature5') }
                ]
            },
            { icon: 'fa-tasks', title: this.t('help.tasksTitle'), desc: this.t('help.tasksDesc'), features: [] },
            { icon: 'fa-clock', title: this.t('help.focusTitle'), desc: this.t('help.focusDesc'), features: [] },
            { icon: 'fa-spa', title: this.t('help.habitsTitle'), desc: this.t('help.habitsDesc'), features: [] },
            { icon: 'fa-mosque', title: this.t('help.prayerTitle'), desc: this.t('help.prayerDesc'), features: [] },
            { icon: 'fa-sticky-note', title: this.t('help.notesTitle'), desc: this.t('help.notesDesc'), features: [] },
            { icon: 'fa-bed', title: this.t('help.sleepTitle'), desc: this.t('help.sleepDesc'), features: [] },
            { icon: 'fa-tint', title: this.t('help.waterTitle'), desc: this.t('help.waterDesc'), features: [] },
            { icon: 'fa-chart-bar', title: this.t('help.reportsTitle'), desc: this.t('help.reportsDesc'), features: [] },
            { icon: 'fa-cog', title: this.t('help.settingsTitle'), desc: this.t('help.settingsDesc'), features: [] },
            { icon: 'fa-check-circle', title: this.t('help.readyTitle'), desc: this.t('help.readyDesc'), features: [] }
        ];
    },

    renderHelpStep() {
        const container = document.getElementById('helpSteps');
        const dots = document.getElementById('helpDots');
        const prevBtn = document.getElementById('helpPrev');
        const nextBtn = document.getElementById('helpNext');
        const finishBtn = document.getElementById('helpFinish');
        if (!container) return;
        const step = this.helpSteps[this.helpStep];
        const featuresHtml = step.features.length > 0 
            ? `<div class="help-step-features">${step.features.map(f => `
                <div class="help-feature"><i class="fas ${f.icon}"></i> ${f.text}</div>
            `).join('')}</div>` 
            : '';
        container.innerHTML = `
            <div class="help-step active">
                <div class="help-step-icon"><i class="fas ${step.icon}"></i></div>
                <h3>${step.title}</h3>
                <p>${step.desc}</p>
                ${featuresHtml}
            </div>
        `;
        if (dots) {
            dots.innerHTML = this.helpSteps.map((_, i) => `
                <div class="help-dot ${i === this.helpStep ? 'active' : ''}" onclick="app.goToHelpStep(${i})"></div>
            `).join('');
        }
        if (prevBtn) prevBtn.style.display = this.helpStep > 0 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = this.helpStep < this.helpSteps.length - 1 ? 'flex' : 'none';
        if (finishBtn) finishBtn.style.display = this.helpStep === this.helpSteps.length - 1 ? 'flex' : 'none';
    },

    nextHelpStep() {
        if (this.helpStep < this.helpSteps.length - 1) {
            this.helpStep++;
            this.renderHelpStep();
        }
    },

    prevHelpStep() {
        if (this.helpStep > 0) {
            this.helpStep--;
            this.renderHelpStep();
        }
    },

    goToHelpStep(index) {
        this.helpStep = index;
        this.renderHelpStep();
    },

    async signOut() {
        const message = this.settings.language === 'ar'
            ? 'هل تريد تسجيل الخروج؟'
            : 'Are you sure you want to sign out?';

        if (!confirm(message)) return;

        const button = document.getElementById('logoutButton');
        if (button) button.disabled = true;

        try {
            if (!window.NuvioAuth) throw new Error('Authentication is unavailable');
            await window.NuvioAuth.signOut();
            this.showToast(
                this.settings.language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully',
                'success'
            );
        } catch (error) {
            console.error('Nuvio sign out:', error);
            this.showToast(
                this.settings.language === 'ar' ? 'تعذر تسجيل الخروج، حاول مرة أخرى' : 'Sign out failed, please try again',
                'error'
            );
            if (button) button.disabled = false;
        }
    },
});
