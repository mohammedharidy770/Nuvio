Object.assign(NuvioApp.prototype, {
    openHabitModal(habitId = null) {
        const modal = document.getElementById('habitModal');
        const overlay = document.getElementById('habitModalOverlay');
        const form = document.getElementById('habitForm');
        const title = document.getElementById('habitModalTitle');

        if (form) form.reset();
        const hid = document.getElementById('habitId');
        if (hid) hid.value = '';

        // Reset days selector
        document.querySelectorAll('#habitDaysSelector input').forEach(cb => cb.checked = true);

        if (habitId) {
            const habit = this.habits.find(h => h.id === habitId);
            if (habit) {
                if (title) title.textContent = this.t('habits.editHabit');
                if (hid) hid.value = habit.id;
                const ht = document.getElementById('habitTitle');
                if (ht) ht.value = habit.title;
                const hd = document.getElementById('habitDescription');
                if (hd) hd.value = habit.description || '';
                const hi = document.getElementById('habitIcon');
                if (hi) hi.value = habit.icon || 'fa-book';
                const hc = document.getElementById('habitColor');
                if (hc) hc.value = habit.color || '#dc2626';
                const htg = document.getElementById('habitTarget');
                if (htg) htg.value = habit.target || 1;
                const hu = document.getElementById('habitUnit');
                if (hu) hu.value = habit.unit || (this.settings.language === 'ar' ? 'مرة' : 'time');
                const hrt = document.getElementById('habitReminderTime');
                if (hrt) hrt.value = habit.reminderTime || '';

                // Set days
                if (habit.repeatDays) {
                    document.querySelectorAll('#habitDaysSelector input').forEach(cb => {
                        cb.checked = habit.repeatDays.includes(parseInt(cb.value));
                    });
                }
            }
        } else {
            if (title) title.textContent = this.t('habits.newHabit');
            const hu = document.getElementById('habitUnit');
            if (hu) hu.value = this.settings.language === 'ar' ? 'مرة' : 'time';
        }

        if (modal) modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeHabitModal() {
        const modal = document.getElementById('habitModal');
        const overlay = document.getElementById('habitModalOverlay');
        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    },

    saveHabit(e) {
        e.preventDefault();

        const habitId = document.getElementById('habitId').value;
        const title = document.getElementById('habitTitle').value.trim();
        const description = document.getElementById('habitDescription').value.trim();
        const requestedIcon = document.getElementById('habitIcon').value;
        const requestedColor = document.getElementById('habitColor').value;
        const icon = /^[a-z0-9-]{1,40}$/i.test(requestedIcon) ? requestedIcon : 'fa-bullseye';
        const color = /^#[0-9a-f]{6}$/i.test(requestedColor) ? requestedColor : '#64748b';
        const target = parseInt(document.getElementById('habitTarget').value) || 1;
        const unit = document.getElementById('habitUnit').value || (this.settings.language === 'ar' ? 'مرة' : 'time');
        const reminderTime = document.getElementById('habitReminderTime').value || null;
        const repeatDays = Array.from(document.querySelectorAll('#habitDaysSelector input:checked')).map(cb => parseInt(cb.value));

        if (!title) {
            this.showToast(this.t('habits.habitTitlePlaceholder'), 'warning');
            return;
        }

        if (habitId) {
            const index = this.habits.findIndex(h => h.id === habitId);
            if (index !== -1) {
                this.habits[index] = {
                    ...this.habits[index],
                    title, description, icon, color, target, unit, reminderTime, repeatDays
                };
                this.showToast(this.t('habits.updated'), 'success');
            }
        } else {
            const newHabit = {
                id: 'habit-' + Date.now(),
                title, description, icon, color, target, unit, reminderTime, repeatDays,
                logs: {},
                createdAt: new Date().toISOString()
            };
            this.habits.unshift(newHabit);
            this.showToast(this.t('habits.saved'), 'success');
        }

        this.saveHabits();
        this.closeHabitModal();
        this.renderHabits();
    },

    deleteHabit(habitId) {
        if (!confirm(this.t('habits.deleteConfirm'))) return;
        this.habits = this.habits.filter(h => h.id !== habitId);
        this.saveHabits();
        this.renderHabits();
        this.showToast(this.t('habits.deleted'), 'success');
    },

    toggleHabitToday(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const today = new Date().toDateString();
        if (!habit.logs || typeof habit.logs !== 'object' || Array.isArray(habit.logs)) habit.logs = {};
        const target = Number.isFinite(Number(habit.target)) && Number(habit.target) > 0 ? Number(habit.target) : 1;
        habit.target = target;
        const todayLog = Number(habit.logs[today]) || 0;

        if (todayLog >= target) {
            delete habit.logs[today];
            this.showToast(this.t('habits.uncheckDone'), 'info');
        } else {
            habit.logs[today] = target;
            this.showToast(this.t('habits.checkDone'), 'success');
        }

        this.saveHabits();
        this.renderHabits();
    },

    getHabitStreak(habit) {
        const logs = habit.logs && typeof habit.logs === 'object' && !Array.isArray(habit.logs) ? habit.logs : {};
        const repeatDays = Array.isArray(habit.repeatDays) ? habit.repeatDays.filter(day => Number.isInteger(day) && day >= 0 && day <= 6) : [];
        if (repeatDays.length === 0) return 0;
        const dates = Object.keys(logs).sort((a, b) => new Date(b) - new Date(a));
        if (dates.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if done today or yesterday to start counting
        const todayStr = today.toDateString();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let checkDate = today;
        if (!logs[todayStr] || logs[todayStr] < habit.target) {
            checkDate = yesterday;
        }

        while (true) {
            const checkStr = checkDate.toDateString();
            const dayOfWeek = checkDate.getDay();

            // If this day is not in repeatDays and it's not logged, skip it
            if (!repeatDays.includes(dayOfWeek)) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }

            if (logs[checkStr] && logs[checkStr] >= habit.target) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    },

    getHabitProgress(habit) {
        const today = new Date().toDateString();
        const logs = habit.logs && typeof habit.logs === 'object' && !Array.isArray(habit.logs) ? habit.logs : {};
        const todayLog = Number(logs[today]) || 0;
        const target = Number(habit.target);
        if (!Number.isFinite(target) || target <= 0) return 0;
        return Math.max(0, Math.min((todayLog / target) * 100, 100));
    },

    isHabitDoneToday(habit) {
        const today = new Date().toDateString();
        const logs = habit.logs && typeof habit.logs === 'object' && !Array.isArray(habit.logs) ? habit.logs : {};
        return Number(logs[today]) >= Number(habit.target);
    },

    renderHabits() {
        const list = document.getElementById('habitsList');
        const empty = document.getElementById('habitsEmpty');
        const weeklyGrid = document.getElementById('habitsWeeklyGrid');

        // Update stats
        let maxStreak = 0;
        let completedToday = 0;
        let totalRate = 0;

        this.habits.forEach(h => {
            const streak = this.getHabitStreak(h);
            if (streak > maxStreak) maxStreak = streak;
            if (this.isHabitDoneToday(h)) completedToday++;

            // Calculate success rate
            const habitLogs = h.logs && typeof h.logs === 'object' && !Array.isArray(h.logs) ? h.logs : {};
            const logs = Object.keys(habitLogs).filter(key => Number(habitLogs[key]) > 0).length;
            const daysSince = Math.ceil((new Date() - new Date(h.createdAt)) / (1000 * 60 * 60 * 24));
            const expectedDays = Math.max(daysSince, 1);
            totalRate += (logs / expectedDays) * 100;
        });

        const avgRate = this.habits.length > 0 ? Math.round(totalRate / this.habits.length) : 0;

        const hs = document.getElementById('habitsStreak');
        const hct = document.getElementById('habitsCompletedToday');
        const hr = document.getElementById('habitsRate');
        if (hs) hs.textContent = maxStreak;
        if (hct) hct.textContent = completedToday + '/' + this.habits.length;
        if (hr) hr.textContent = avgRate + '%';

        if (this.habits.length === 0) {
            if (list) list.style.display = 'none';
            if (empty) empty.style.display = 'block';
            if (weeklyGrid) weeklyGrid.innerHTML = '';
            return;
        }

        if (list) {
            list.style.display = 'flex';
            list.innerHTML = this.habits.map(habit => this.renderHabitItem(habit)).join('');
        }
        if (empty) empty.style.display = 'none';

        // Render weekly overview
        if (weeklyGrid) {
            weeklyGrid.innerHTML = this.habits.map(habit => this.renderHabitWeekly(habit)).join('');
        }
    },

    renderHabitItem(habit) {
        const escapeHTML = window.NuvioSecurity.escapeHTML;
        const safeId = window.NuvioSecurity.safeId(habit.id);
        const safeColor = /^#[0-9a-f]{6}$/i.test(habit.color || '') ? habit.color : '#64748b';
        const safeIcon = /^[a-z0-9-]{1,40}$/i.test(habit.icon || '') ? habit.icon : 'fa-bullseye';
        const streak = this.getHabitStreak(habit);
        const progress = this.getHabitProgress(habit);
        const isDone = this.isHabitDoneToday(habit);
        const today = new Date().getDay();
        const repeatDays = Array.isArray(habit.repeatDays) ? habit.repeatDays : [];
        const isActiveDay = repeatDays.includes(today);
        const safeReminderTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(habit.reminderTime || '')) ? habit.reminderTime : '';
        const safeTarget = Number.isFinite(Number(habit.target)) && Number(habit.target) > 0 ? Number(habit.target) : 1;
        const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;

        return `
            <div class="habit-item" style="${!isActiveDay ? 'opacity: 0.6;' : ''}">
                <div class="habit-icon-wrap" style="background: ${safeColor}15; color: ${safeColor};">
                    <i class="fas ${safeIcon}"></i>
                </div>
                <div class="habit-content">
                    <div class="habit-title">${escapeHTML(habit.title)}</div>
                    <div class="habit-meta">
                        ${streak > 0 ? `<span class="habit-streak"><i class="fas fa-fire"></i> ${streak}</span>` : ''}
                        <span>${safeTarget} ${escapeHTML(habit.unit)}</span>
                        ${safeReminderTime ? `<span><i class="fas fa-bell"></i> ${escapeHTML(safeReminderTime)}</span>` : ''}
                    </div>
                </div>
                <div class="habit-progress-wrap">
                    <div class="habit-progress-bar">
                        <div class="habit-progress-fill" style="width: ${safeProgress}%; background: ${safeColor};"></div>
                    </div>
                    <span class="habit-progress-text">${Math.round(safeProgress)}%</span>
                </div>
                <div class="habit-check ${isDone ? 'checked' : ''}" onclick="event.stopPropagation(); app.toggleHabitToday('${safeId}')">
                    ${isDone ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="habit-actions">
                    <button class="task-action-btn" onclick="event.stopPropagation(); app.openHabitModal('${safeId}')" title="${this.t('habits.editHabit')}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" onclick="event.stopPropagation(); app.deleteHabit('${safeId}')" title="${this.t('actions.clearAll')}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },

    renderHabitWeekly(habit) {
        const days = [];
        const today = new Date();
        const dayNames = this.settings.language === 'ar'
            ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
            : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            const dayOfWeek = date.getDay();
            const isToday = i === 0;
            const logs = habit.logs && typeof habit.logs === 'object' && !Array.isArray(habit.logs) ? habit.logs : {};
            const repeatDays = Array.isArray(habit.repeatDays) ? habit.repeatDays : [];
            const isDone = Number(logs[dateStr]) >= Number(habit.target || 1);
            const isRepeatDay = repeatDays.includes(dayOfWeek);

            let cssClass = 'habit-day-dot';
            if (isDone) cssClass += ' done';
            else if (!isRepeatDay) cssClass += ' missed';
            if (isToday) cssClass += ' today';

            days.push(`<div class="${cssClass}" title="${date.toLocaleDateString()}">${dayNames[dayOfWeek]}</div>`);
        }

        return `
            <div class="habit-weekly-row">
                <span class="habit-weekly-name">${habit.title}</span>
                <div class="habit-weekly-days">
                    ${days.join('')}
                </div>
            </div>
        `;
    },
});
