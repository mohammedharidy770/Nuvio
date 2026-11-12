Object.assign(NuvioApp.prototype, {
    updateTimerSetting(key, value) {
        const num = parseInt(value);
        if (num && num > 0) {
            this.settings[key] = num;
            this.saveData();
            this.showToast(this.settings.language === 'ar' ? 'تم تحديث الإعدادات' : 'Settings updated', 'success');
        }
    },

    populateTimerSettings() {
        const pom = document.getElementById('pomodoroDuration');
        const short = document.getElementById('shortBreakDuration');
        const long = document.getElementById('longBreakDuration');
        if (pom) pom.value = this.settings.pomodoroDuration;
        if (short) short.value = this.settings.shortBreakDuration;
        if (long) long.value = this.settings.longBreakDuration;
    },

    setTimerMode(mode) {
        this.timerState.mode = mode;
        const durations = {
            pomodoro: this.settings.pomodoroDuration,
            short: this.settings.shortBreakDuration,
            long: this.settings.longBreakDuration
        };

        if (this.timerState.running) this.pauseTimer();
        this.timerState.mode = mode;
        this.timerState.totalTime = durations[mode] * 60;
        this.timerState.timeLeft = this.timerState.totalTime;
        this.timerState.endAt = null;
        this.resetTimer();
    },

    toggleTimer() {
        if (this.timerState.running) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    },

    startTimer() {
        if (this.timerState.running) return;

        this.timerState.running = true;
        this.timerState.paused = false;
        this.timerState.endAt = Date.now() + this.timerState.timeLeft * 1000;
        this.persistTimerState();

        const tsb = document.getElementById('timerStartBtn');
        const tpb = document.getElementById('timerPauseBtn');
        if (tsb) tsb.style.display = 'none';
        if (tpb) tpb.style.display = 'flex';

        clearInterval(this.timerState.interval);
        this.timerState.interval = setInterval(() => {
            this.timerState.timeLeft = Math.max(0, Math.ceil((this.timerState.endAt - Date.now()) / 1000));
            this.updateTimerDisplay();
            if (this.timerState.timeLeft % 5 === 0 || this.timerState.timeLeft <= 0) this.persistTimerState();
            if (this.timerState.timeLeft <= 0) this.timerComplete();
        }, 1000);
        this.updateTimerDisplay();
    },

    pauseTimer() {
        this.timerState.running = false;
        this.timerState.paused = true;
        this.timerState.endAt = null;
        clearInterval(this.timerState.interval);
        this.persistTimerState();

        const tsb = document.getElementById('timerStartBtn');
        const tpb = document.getElementById('timerPauseBtn');
        if (tsb) {
            tsb.style.display = 'flex';
            tsb.innerHTML = '<i class="fas fa-play"></i><span>' + this.t('timer.start') + '</span>';
        }
        if (tpb) tpb.style.display = 'none';
    },

    resetTimer() {
        this.timerState.running = false;
        this.timerState.paused = false;
        clearInterval(this.timerState.interval);

        this.timerState.timeLeft = this.timerState.totalTime;
        this.timerState.endAt = null;
        this.persistTimerState();
        this.updateTimerDisplay();

        const tsb = document.getElementById('timerStartBtn');
        const tpb = document.getElementById('timerPauseBtn');
        if (tsb) {
            tsb.style.display = 'flex';
            tsb.innerHTML = '<i class="fas fa-play"></i><span>' + this.t('timer.start') + '</span>';
        }
        if (tpb) tpb.style.display = 'none';
    },

    persistTimerState() {
        const state = {
            mode: this.timerState.mode,
            timeLeft: this.timerState.timeLeft,
            totalTime: this.timerState.totalTime,
            running: this.timerState.running,
            paused: this.timerState.paused,
            endAt: this.timerState.endAt || null,
            currentTask: this.timerState.currentTask || null
        };
        try { localStorage.setItem('nuvio_timer_state', JSON.stringify(state)); } catch (error) {}
    },

    restoreTimerState() {
        try {
            const saved = JSON.parse(localStorage.getItem('nuvio_timer_state') || 'null');
            if (!saved || !saved.mode) return;
            this.timerState.mode = saved.mode;
            this.timerState.totalTime = Number(saved.totalTime) || this.settings.pomodoroDuration * 60;
            this.timerState.timeLeft = Number(saved.timeLeft) || this.timerState.totalTime;
            this.timerState.currentTask = saved.currentTask || null;
            if (saved.running && saved.endAt) {
                this.timerState.endAt = saved.endAt;
                this.timerState.timeLeft = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
                this.timerState.running = false;
                this.timerState.paused = false;
                if (this.timerState.timeLeft > 0) {
                    this.startTimer();
                } else {
                    this.timerComplete();
                }
            } else {
                this.timerState.running = false;
                this.timerState.paused = Boolean(saved.paused);
                this.timerState.endAt = null;
                this.updateTimerDisplay();
                this.syncTimerButtons();
            }
        } catch (error) { console.warn('Could not restore focus timer:', error); }
    },

    syncTimerButtons() {
        const start = document.getElementById('timerStartBtn');
        const pause = document.getElementById('timerPauseBtn');
        if (start) start.style.display = this.timerState.running ? 'none' : 'flex';
        if (pause) pause.style.display = this.timerState.running ? 'flex' : 'none';
    },

    renderFocusStats() {
        const today = new Date().toDateString();
        const sessions = (this.focusSessions || []).filter(s => new Date(s.date).toDateString() === today);
        const focus = sessions.filter(s => s.type === 'pomodoro').reduce((sum,s) => sum + (Number(s.duration)||0),0);
        const breaks = sessions.filter(s => s.type !== 'pomodoro').reduce((sum,s) => sum + (Number(s.duration)||0),0);
        const count = sessions.filter(s => s.type === 'pomodoro').length;
        const countEl = document.getElementById('sessionCount');
        const focusEl = document.getElementById('sessionFocusTime');
        const breakEl = document.getElementById('sessionBreakTime');
        if (countEl) countEl.textContent = count;
        if (focusEl) focusEl.textContent = focus >= 60 ? (focus / 60).toFixed(1).replace(/\\.0$/,'') + 'h' : focus + 'm';
        if (breakEl) breakEl.textContent = breaks + 'm';
        const grade = Math.min(100, Math.round(focus / Math.max(1, this.settings.pomodoroDuration * 4) * 100));
        const fill = document.getElementById('gradeFill');
        if (fill) fill.style.width = grade + '%';
        const value = document.querySelector('#productivityGrade .grade-value');
        if (value) value.textContent = grade >= 75 ? (this.settings.language === 'ar' ? 'ممتاز' : 'Excellent') : grade >= 40 ? (this.settings.language === 'ar' ? 'جيد' : 'Good') : (this.settings.language === 'ar' ? 'ابدأ جلسة' : 'Start a session');
    },

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerState.timeLeft / 60);
        const seconds = this.timerState.timeLeft % 60;

        const tm = document.getElementById('timerMinutes');
        const ts = document.getElementById('timerSeconds');
        if (tm) tm.textContent = String(minutes).padStart(2, '0');
        if (ts) ts.textContent = String(seconds).padStart(2, '0');

        const circle = document.getElementById('timerProgress');
        if (circle) {
            const circumference = 2 * Math.PI * 130;
            const offset = circumference - (this.timerState.timeLeft / this.timerState.totalTime) * circumference;
            circle.style.strokeDashoffset = offset;
        }

        document.title = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} — Nuvio`;
    },

    timerComplete() {
        clearInterval(this.timerState.interval);
        this.timerState.running = false;

        this.playNotificationSound();

        if (this.settings.timerNotification) {
            this.showNotification('Timer Ended!', this.timerState.mode === 'pomodoro' ? 'Focus session ended' : 'Break ended');
        }

        if (this.timerState.mode === 'pomodoro') {
            this.focusSessions.push({
                date: new Date().toISOString(),
                duration: Math.round(this.timerState.totalTime / 60),
                type: 'pomodoro',
                taskId: this.timerState.currentTask
            });

            if (this.timerState.currentTask) {
                const task = this.tasks.find(t => t.id === this.timerState.currentTask);
                if (task) {
                    task.actualTime = (Number(task.actualTime) || 0) + Math.round(this.timerState.totalTime / 60);
                }
            }

            this.saveData();
            this.showToast(this.settings.language === 'ar' ? 'أحسنت! أكملت جلسة تركيز' : 'Great! Focus session completed', 'success');
        } else {
            this.focusSessions.push({ date: new Date().toISOString(), duration: this.timerState.totalTime / 60, type: this.timerState.mode, taskId: this.timerState.currentTask || null });
            this.saveData();
            this.showToast(this.settings.language === 'ar' ? 'انتهت الاستراحة!' : 'Break ended!', 'info');
        }

        this.resetTimer();
        this.renderAll();
        this.renderFocusStats();
        document.title = 'Nuvio';
    },

    startScheduleAutomation() {
        if (this.scheduleAutomationInterval) clearInterval(this.scheduleAutomationInterval);
        this.checkScheduledFocusBlocks();
        this.scheduleAutomationInterval = setInterval(() => this.checkScheduledFocusBlocks(), 15000);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.checkScheduledFocusBlocks();
        });
        window.addEventListener('focus', () => this.checkScheduledFocusBlocks());
    },

    checkScheduledFocusBlocks() {
        if (!Array.isArray(this.tasks) || !this.tasks.length) return;
        const now = Date.now();
        if (this.timerState?.running || this.timerState?.paused) return;

        const due = this.tasks
            .filter(task => task && task.status !== 'completed' && task.autoStart === true && task.dueDate)
            .map(task => {
                const start = Date.parse(task.dueDate);
                const explicitEnd = task.endDate ? Date.parse(task.endDate) : NaN;
                const duration = Math.min(1440, Math.max(1, Number(task.estimatedTime) || 25));
                const end = Number.isFinite(explicitEnd) ? explicitEnd : start + duration * 60000;
                return { task, start, end };
            })
            .filter(item => Number.isFinite(item.start) && Number.isFinite(item.end)
                && item.end > item.start && item.start <= now && now < item.end
                && item.task.autoStartedFor !== new Date(item.start).toISOString())
            .sort((a, b) => a.start - b.start);

        if (!due.length) return;
        const { task, start, end } = due[0];
        const startKey = new Date(start).toISOString();
        task.autoStartedFor = startKey;
        this.tasks.forEach(item => {
            if (item.id !== task.id && item.status === 'in-progress') item.status = 'pending';
        });
        task.status = 'in-progress';

        const remainingSeconds = Math.max(1, Math.ceil((end - now) / 1000));
        this.timerState.mode = 'pomodoro';
        this.timerState.totalTime = remainingSeconds;
        this.timerState.timeLeft = remainingSeconds;
        this.timerState.currentTask = task.id;
        this.timerState.running = false;
        this.timerState.paused = false;
        this.timerState.endAt = null;

        this.saveData();
        const info = document.getElementById('timerTaskInfo');
        if (info) {
            const name = document.createElement('div');
            name.className = 'task-name';
            name.textContent = String(task.title || 'جلسة مذاكرة');
            const description = document.createElement('p');
            description.textContent = this.settings.language === 'ar'
                ? 'بدأت الجلسة تلقائيًا حسب جدولك'
                : 'Session started automatically from your schedule';
            info.replaceChildren(name, description);
        }
        // Start before showing the focus section so its restore hook cannot overwrite this scheduled session.
        this.startTimer();
        this.showSection('focus');
        this.updateTimerDisplay();
        const message = this.settings.language === 'ar'
            ? 'بدأت جلسة ' + (task.title || 'المذاكرة') + ' تلقائيًا حسب جدولك'
            : 'Your scheduled session has started: ' + (task.title || 'Study');
        this.addNotification('focus', message);
        this.showNotification('Nuvio', message);
        this.showToast(message, 'success');
    },

    startTaskFocus(taskId) {
        this.timerState.currentTask = taskId;
        const task = this.tasks.find(t => t.id === taskId);

        const tti = document.getElementById('timerTaskInfo');
        if (tti) {
            tti.innerHTML = `
                <div class="task-name">${task ? task.title : ''}</div>
                <p>${this.settings.language === 'ar' ? 'جلسة تركيز على المهمة المختارة' : 'Focus session on selected task'}</p>
            `;
        }

        this.showSection('focus');
        this.setTimerMode('pomodoro');
    },

    startQuickFocus() {
        this.timerState.currentTask = null;
        const tti = document.getElementById('timerTaskInfo');
        if (tti) tti.innerHTML = `<p>${this.settings.language === 'ar' ? 'جلسة تركيز سريعة' : 'Quick focus session'}</p>`;
        this.showSection('focus');
        this.setTimerMode('pomodoro');
    },
});
