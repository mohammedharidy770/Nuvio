// ===== Nuvio - Personal Operating System =====
// Version 2.0 - Red/Black/White Theme + Bilingual

class NuvioApp {
    constructor() {
        this.tasks = [];
        this.focusSessions = [];
        this.notifications = [];
        this.settings = {
            pomodoroDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            darkMode: false,
            language: 'ar',
            timerNotification: true,
            taskReminder: true
        };

        this.currentSection = 'dashboard';
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.selectedDate = new Date();
        this.calendarDate = new Date();

        this.timerState = {
            running: false,
            paused: false,
            mode: 'pomodoro',
            timeLeft: 25 * 60,
            totalTime: 25 * 60,
            interval: null,
            currentTask: null,
            endAt: null
        };

        this.categories = {

            coding: { nameAr: 'برمجة', nameEn: 'Coding', icon: '💻', color: '#6366f1' },
            work: { nameAr: 'عمل', nameEn: 'Work', icon: '💼', color: '#3b82f6' },
            study: { nameAr: 'دراسة', nameEn: 'Study', icon: '📚', color: '#10b981' },
            health: { nameAr: 'صحة', nameEn: 'Health', icon: '❤️', color: '#ef4444' },
                        sport: { nameAr: 'رياضة', nameEn: 'Sports', icon: '🥇', color: '#a72626' },
            finance: { nameAr: 'مالية', nameEn: 'Finance', icon: '💰', color: '#f59e0b' },
            personal: { nameAr: 'شخصي', nameEn: 'Personal', icon: '👤', color: '#8b5cf6' },
            Islam: { nameAr: 'إسلام', nameEn: 'Islam', icon: '🕌', color: '#16a34a' },
            development: { nameAr: 'تطوير', nameEn: 'Development', icon: '🚀', color: '#f97316' },
        };

        this.priorities = {
            low: { nameAr: 'منخفضة', nameEn: 'Low', color: '#6c757d' },
            medium: { nameAr: 'متوسطة', nameEn: 'Medium', color: '#3b82f6' },
            high: { nameAr: 'عالية', nameEn: 'High', color: '#f59e0b' },
            urgent: { nameAr: 'عاجلة', nameEn: 'Urgent', color: '#dc2626' }
        };

        this.habits = [];
        this.prayerData = {
            city: 'Cairo',
            method: '5',
            times: null,
            hijriDate: null,
            location: null
        };
        this.prayerCountdownInterval = null;
                this.helpStep = 0;
        this.helpSteps = [];
                this.notes = [];
                        this.sleepRecords = [];
        this.waterData = {
            goal: 8,
            today: 0,
            history: {},
            reminder: false
        };
        this.currentNoteTag = 'all';
        this.userProfile = {
            name: '',
            avatar: null
        };

        this.init();
    }

    init() {
        this.loadData();
        this.restoreTimerState?.();
        this.loadHabits();
        this.loadPrayerSettings();
        this.populateTimerSettings();
                this.loadNotes();
                        this.loadSleepRecords();
        this.loadWaterData();
        this.startWaterReminder();
                this.loadUserProfile();
        this.checkWelcomeScreen();
        this.applyTheme();
        this.applyLanguage();
        this.setupEventListeners();
        const firstRun = localStorage.getItem("nuvio_first_run");
        if (!firstRun) {
            this.addDemoData();
            localStorage.setItem("nuvio_first_run", "true");
        }
        this.updateTime();
        this.renderAll();
        this.startClock();
        this.checkOverdueTasks();
        this.requestNotificationPermission();
        const helpSeen = localStorage.getItem('nuvio_help_seen');
        if (!helpSeen) {
            setTimeout(() => this.showHelp(), 800);
        }

        this.loadPrayerTimes();
        this.startPrayerCountdown();
    }
}
