Object.assign(NuvioApp.prototype, {
    loadData() {
        try {
            const tasks = localStorage.getItem('nuvio_tasks');
            const sessions = localStorage.getItem('nuvio_sessions');
            const settings = localStorage.getItem('nuvio_settings');
            const notifications = localStorage.getItem('nuvio_notifications');

            if (tasks) this.tasks = JSON.parse(tasks);
            if (sessions) this.focusSessions = JSON.parse(sessions);
            if (settings) this.settings = { ...this.settings, ...JSON.parse(settings) };
            if (notifications) this.notifications = JSON.parse(notifications);
        } catch (e) {
            console.error('Error loading data:', e);
        }
    },

    saveData() {
        try {
            localStorage.setItem('nuvio_tasks', JSON.stringify(this.tasks));
            localStorage.setItem('nuvio_sessions', JSON.stringify(this.focusSessions));
            localStorage.setItem('nuvio_settings', JSON.stringify(this.settings));
            localStorage.setItem('nuvio_notifications', JSON.stringify(this.notifications));
        } catch (e) {
            console.error('Error saving data:', e);
            this.showToast(this.t('error.saveData') || 'Error saving data', 'error');
        }
        window.NuvioSync?.scheduleSave();
    },

    addDemoData() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isAr = this.settings.language === 'ar';

        this.tasks = [
            {
                id: 'demo-1',
                title: isAr ? 'إعداد تقرير المشروع الشهري' : 'Prepare Monthly Project Report',
                description: isAr ? 'كتابة وتحليل تقرير أداء المشروع' : 'Write and analyze project performance report',
                category: 'work', priority: 'high', status: 'pending',
                dueDate: tomorrow.toISOString(), estimatedTime: 120, actualTime: 0,
                repeat: 'monthly', reminder: 60,
                tags: isAr ? ['مشروع', 'تقرير'] : ['project', 'report'],
                createdAt: now.toISOString(), completedAt: null
            },
            {
                id: 'demo-2',
                title: isAr ? 'قراءة كتاب التطوير الذاتي' : 'Read Self-Development Book',
                description: isAr ? 'قراءة 30 صفحة' : 'Read 30 pages',
                category: 'development', priority: 'medium', status: 'in-progress',
                dueDate: null, estimatedTime: 45, actualTime: 20,
                repeat: 'daily', reminder: 0,
                tags: isAr ? ['قراءة', 'تطوير'] : ['reading', 'development'],
                createdAt: now.toISOString(), completedAt: null
            },
            {
                id: 'demo-3',
                title: isAr ? 'تمارين رياضية' : 'Exercise',
                description: isAr ? 'جلسة تمارين cardio' : 'Cardio workout session',
                category: 'health', priority: 'medium', status: 'pending',
                dueDate: null, estimatedTime: 30, actualTime: 0,
                repeat: 'daily', reminder: 15,
                tags: isAr ? ['رياضة', 'صحة'] : ['sports', 'health'],
                createdAt: now.toISOString(), completedAt: null
            },
            {
                id: 'demo-4',
                title: isAr ? 'دفع فاتورة الكهرباء' : 'Pay Electricity Bill',
                description: isAr ? 'سداد الفاتورة' : 'Pay the bill before deadline',
                category: 'finance', priority: 'urgent', status: 'pending',
                dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                estimatedTime: 10, actualTime: 0, repeat: 'monthly', reminder: 1440,
                tags: isAr ? ['فواتير', 'عاجل'] : ['bills', 'urgent'],
                createdAt: now.toISOString(), completedAt: null
            },
            {
                id: 'demo-5',
                title: isAr ? 'مراجعة دروس الرياضيات' : 'Review Math Lessons',
                description: isAr ? 'حل تمارين الفصل الثالث' : 'Solve chapter 3 exercises',
                category: 'study', priority: 'high', status: 'completed',
                dueDate: null, estimatedTime: 90, actualTime: 85,
                repeat: 'none', reminder: 0,
                tags: isAr ? ['دراسة', 'رياضيات'] : ['study', 'math'],
                createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        this.focusSessions = [
            { date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), duration: 25, type: 'pomodoro', taskId: 'demo-5' },
            { date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), duration: 25, type: 'pomodoro', taskId: 'demo-5' },
            { date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), duration: 25, type: 'pomodoro', taskId: 'demo-2' },
            { date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), duration: 25, type: 'pomodoro', taskId: null },
            { date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), duration: 25, type: 'pomodoro', taskId: null },
            { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), duration: 25, type: 'pomodoro', taskId: null },
            { date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), duration: 25, type: 'pomodoro', taskId: null }
        ];

        this.saveData();
        this.showToast(this.t('toast.demoData') || 'Demo data added', 'info');
    },

    exportData() {
        const data = {
            schemaVersion: 2,
            exportDate: new Date().toISOString(),
            tasks: this.tasks,
            focusSessions: this.focusSessions,
            settings: this.settings,
            notifications: this.notifications,
            habits: this.habits,
            notes: this.notes,
            sleepRecords: this.sleepRecords,
            waterData: this.waterData,
            prayerData: this.prayerData,
            userProfile: this.userProfile,
            timerState: this.timerState ? {
                mode: this.timerState.mode,
                timeLeft: this.timerState.timeLeft,
                totalTime: this.timerState.totalTime,
                paused: this.timerState.paused,
                currentTask: this.timerState.currentTask || null
            } : null,
            aiHistory: this.getLocalBackupValue('nuvio_ai_history', []),
            aiSettings: this.getLocalBackupValue('nuvio_ai_settings', null)
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nuvio-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        this.showToast(this.settings.language === 'ar' ? 'تم تصدير النسخة الاحتياطية الكاملة' : 'Full backup exported', 'success');
    },

    getLocalBackupValue(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch {
            return fallback;
        }
    },

    importData() {
        const input = document.getElementById('importFileInput');
        if (input) input.click();
    },

    handleImport(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            this.showToast(this.settings.language === 'ar' ? 'حجم الملف أكبر من 10 ميجابايت' : 'Backup file exceeds 10 MB', 'error');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(String(reader.result || ''));
                if (!data || typeof data !== 'object' || Array.isArray(data)) {
                    throw new Error('Invalid backup structure');
                }

                const arrayFields = ['tasks', 'focusSessions', 'notifications', 'habits', 'notes', 'sleepRecords'];
                arrayFields.forEach(key => {
                    if (data[key] !== undefined && !Array.isArray(data[key])) {
                        throw new Error('Invalid ' + key);
                    }
                });
                ['settings', 'waterData', 'prayerData', 'userProfile'].forEach(key => {
                    if (data[key] !== undefined && (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key]))) {
                        throw new Error('Invalid ' + key);
                    }
                });

                const backupKeys = [
                    'nuvio_tasks', 'nuvio_sessions', 'nuvio_settings', 'nuvio_notifications',
                    'nuvio_habits', 'nuvio_notes', 'nuvio_sleep', 'nuvio_water',
                    'nuvio_prayer', 'nuvio_user_profile', 'nuvio_timer_state',
                    'nuvio_ai_history', 'nuvio_ai_settings'
                ];
                const current = {};
                backupKeys.forEach(key => {
                    const value = localStorage.getItem(key);
                    if (value !== null) current[key] = value;
                });
                localStorage.setItem('nuvio_pre_import_backup', JSON.stringify({
                    createdAt: new Date().toISOString(),
                    data: current
                }));

                if (data.tasks) this.tasks = data.tasks;
                if (data.focusSessions) this.focusSessions = data.focusSessions;
                if (data.settings) this.settings = { ...this.settings, ...data.settings };
                if (data.notifications) this.notifications = data.notifications;
                if (data.habits) this.habits = data.habits;
                if (data.notes) this.notes = data.notes;
                if (data.sleepRecords) this.sleepRecords = data.sleepRecords;
                if (data.waterData) this.waterData = { ...this.waterData, ...data.waterData };
                if (data.prayerData) this.prayerData = { ...this.prayerData, ...data.prayerData };
                if (data.userProfile) this.userProfile = { ...this.userProfile, ...data.userProfile };

                this.saveData();
                this.saveHabits();
                this.saveNotes();
                this.saveSleepRecords();
                this.saveWaterData();
                this.savePrayerSettings();
                localStorage.setItem('nuvio_user_profile', JSON.stringify(this.userProfile));

                if (Array.isArray(data.aiHistory)) localStorage.setItem('nuvio_ai_history', JSON.stringify(data.aiHistory));
                if (data.aiSettings && typeof data.aiSettings === 'object') localStorage.setItem('nuvio_ai_settings', JSON.stringify(data.aiSettings));
                if (data.timerState && typeof data.timerState === 'object') {
                    localStorage.setItem('nuvio_timer_state', JSON.stringify(data.timerState));
                }

                this.applyTheme();
                this.applyLanguage();
                this.renderAll();
                this.renderHabits?.();
                this.renderNotes?.();
                this.renderSleep?.();
                this.renderWater?.();
                this.showToast(this.settings.language === 'ar' ? 'تم استيراد النسخة الاحتياطية' : 'Backup imported', 'success');
            } catch (error) {
                console.error('Backup import failed:', error);
                this.showToast(this.settings.language === 'ar' ? 'ملف النسخة الاحتياطية غير صالح أو تالف' : 'Invalid or corrupted backup file', 'error');
            } finally {
                event.target.value = '';
            }
        };
        reader.onerror = () => {
            this.showToast(this.settings.language === 'ar' ? 'تعذر قراءة الملف' : 'Could not read file', 'error');
            event.target.value = '';
        };
        reader.readAsText(file);
    },

    clearAllData() {
        const msg = this.settings.language === 'ar'
            ? 'هل أنت متأكد من حذف جميع بياناتك المحلية؟ سيتم الاحتفاظ بإعدادات العرض واللغة.'
            : 'Clear all personal data? Display and language preferences will be kept.';

        if (!confirm(msg)) return;

        this.tasks = [];
        this.focusSessions = [];
        this.notifications = [];
        this.habits = [];
        this.notes = [];
        this.sleepRecords = [];
        this.waterData = { goal: 8, today: 0, history: {}, reminder: false, lastDate: new Date().toDateString() };
        this.prayerData = { city: 'Cairo', method: '5', times: null, hijriDate: null, location: null };
        this.userProfile = { name: '', avatar: null };

        this.timerState.currentTask = null;
        this.resetTimer?.();

        ['nuvio_ai_history', 'nuvio_ai_settings'].forEach(key => localStorage.removeItem(key));
        this.saveData();
        this.saveHabits();
        this.saveNotes();
        this.saveSleepRecords();
        this.saveWaterData();
        this.savePrayerSettings();
        localStorage.setItem('nuvio_user_profile', JSON.stringify(this.userProfile));

        this.renderAll();
        this.renderHabits?.();
        this.renderNotes?.();
        this.renderSleep?.();
        this.renderWater?.();
        this.showToast(this.settings.language === 'ar' ? 'تم حذف جميع البيانات الشخصية' : 'All personal data cleared', 'success');
    },

    loadHabits() {
        try {
            const habits = localStorage.getItem('nuvio_habits');
            if (habits) this.habits = JSON.parse(habits);
        } catch (e) {
            console.error('Error loading habits:', e);
        }
    },

    saveHabits() {
        try {
            localStorage.setItem('nuvio_habits', JSON.stringify(this.habits));
        } catch (e) {
            console.error('Error saving habits:', e);
        }
        window.NuvioSync?.scheduleSave();
    },

    loadUserProfile() {
        try {
            const profile = localStorage.getItem('nuvio_user_profile');
            if (profile) this.userProfile = JSON.parse(profile);
        } catch (e) {
            console.error('Error loading user profile:', e);
        }
    },

    saveUserProfile() {
        const nameInput = document.getElementById('userNameInput');
        const name = nameInput ? nameInput.value.trim() : '';
        
        if (!name) {
            this.showToast(this.settings.language === 'ar' ? 'اكتب اسمك الأول' : 'Please enter your name', 'warning');
            if (nameInput) nameInput.focus();
            return;
        }

        this.userProfile.name = name;
        
        try {
            localStorage.setItem('nuvio_user_profile', JSON.stringify(this.userProfile));
        } catch (e) {
            console.error('Error saving profile:', e);
        }

        this.hideWelcomeScreen();
        
        // Reset welcome screen title for next time
        const sub = document.getElementById('welcomeSubtitle');
        if (sub) sub.textContent = this.t('welcome.subtitle');
        
        this.showToast(this.settings.language === 'ar' ? 'تم تحديث البروفايل!' : 'Profile updated!', 'success');
        window.NuvioSync?.scheduleSave();
    },

    loadSleepRecords() {
        try {
            const records = localStorage.getItem('nuvio_sleep');
            if (records) this.sleepRecords = JSON.parse(records);
        } catch (e) {
            console.error('Error loading sleep:', e);
        }
    },

    saveSleepRecords() {
        try {
            localStorage.setItem('nuvio_sleep', JSON.stringify(this.sleepRecords));
        } catch (e) {
            console.error('Error saving sleep:', e);
        }
        window.NuvioSync?.scheduleSave();
    },

    loadWaterData() {
        try {
            const data = localStorage.getItem('nuvio_water');
            if (data) this.waterData = { ...this.waterData, ...JSON.parse(data) };
            
            // Reset today if new day
            const today = new Date().toDateString();
            const lastDate = this.waterData.lastDate;
            if (lastDate !== today) {
                if (lastDate) {
                    this.waterData.history[lastDate] = this.waterData.today;
                }
                this.waterData.today = 0;
                this.waterData.lastDate = today;
                this.saveWaterData();
            }
        } catch (e) {
            console.error('Error loading water:', e);
        }
    },

    saveWaterData() {
        try {
            localStorage.setItem('nuvio_water', JSON.stringify(this.waterData));
        } catch (e) {
            console.error('Error saving water:', e);
        }
        window.NuvioSync?.scheduleSave();
    },

    loadNotes() {
        try {
            const notes = localStorage.getItem('nuvio_notes');
            if (notes) this.notes = JSON.parse(notes);
        } catch (e) {
            console.error('Error loading notes:', e);
        }
    },

    saveNotes() {
        try {
            localStorage.setItem('nuvio_notes', JSON.stringify(this.notes));
        } catch (e) {
            console.error('Error saving notes:', e);
        }
        window.NuvioSync?.scheduleSave();
    },

    loadPrayerSettings() {
        try {
            const prayer = localStorage.getItem('nuvio_prayer');
            if (prayer) this.prayerData = { ...this.prayerData, ...JSON.parse(prayer) };
        } catch (e) {
            console.error('Error loading prayer settings:', e);
        }
    },

    savePrayerSettings() {
        try {
            localStorage.setItem('nuvio_prayer', JSON.stringify(this.prayerData));
        } catch (e) {
            console.error('Error saving prayer settings:', e);
        }
        window.NuvioSync?.scheduleSave();
    },
});
