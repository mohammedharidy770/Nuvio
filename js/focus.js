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

        this.timerState.totalTime = durations[mode] * 60;
        this.timerState.timeLeft = this.timerState.totalTime;
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

        const tsb = document.getElementById('timerStartBtn');
        const tpb = document.getElementById('timerPauseBtn');
        if (tsb) tsb.style.display = 'none';
        if (tpb) tpb.style.display = 'flex';

        this.timerState.interval = setInterval(() => {
            this.timerState.timeLeft--;
            this.updateTimerDisplay();

            if (this.timerState.timeLeft <= 0) {
                this.timerComplete();
            }
        }, 1000);
    },

    pauseTimer() {
        this.timerState.running = false;
        this.timerState.paused = true;
        clearInterval(this.timerState.interval);

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
        this.updateTimerDisplay();

        const tsb = document.getElementById('timerStartBtn');
        const tpb = document.getElementById('timerPauseBtn');
        if (tsb) {
            tsb.style.display = 'flex';
            tsb.innerHTML = '<i class="fas fa-play"></i><span>' + this.t('timer.start') + '</span>';
        }
        if (tpb) tpb.style.display = 'none';
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
                duration: this.settings.pomodoroDuration,
                type: 'pomodoro',
                taskId: this.timerState.currentTask
            });

            if (this.timerState.currentTask) {
                const task = this.tasks.find(t => t.id === this.timerState.currentTask);
                if (task) {
                    task.actualTime += this.settings.pomodoroDuration;
                }
            }

            this.saveData();
            this.showToast(this.settings.language === 'ar' ? 'أحسنت! أكملت جلسة تركيز' : 'Great! Focus session completed', 'success');
        } else {
            this.showToast(this.settings.language === 'ar' ? 'انتهت الاستراحة!' : 'Break ended!', 'info');
        }

        this.resetTimer();
        this.renderAll();
        document.title = 'Nuvio';
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
