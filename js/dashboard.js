const dashboardMotivationQuotes = [
    { ar: 'وَأَنْ لَيْسَ لِلْإِنْسَانِ إِلَّا مَا سَعَىٰ', en: 'A person will have only what they strive for.', referenceAr: 'سورة النجم، الآية 39', referenceEn: 'An-Najm 53:39' },
    { ar: 'فَإِذَا فَرَغْتَ فَانْصَبْ', en: 'When you are free, devote yourself to what is good.', referenceAr: 'سورة الشرح، الآية 7', referenceEn: 'Ash-Sharh 94:7' },
    { ar: 'وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ', en: 'Say, “Work; Allah will see your deeds, and so will His Messenger and the believers.”', referenceAr: 'سورة التوبة، الآية 105', referenceEn: 'At-Tawbah 9:105' },
    { ar: 'وَأَنَّ سَعْيَهُ سَوْفَ يُرَىٰ', en: 'And that their striving will soon be seen.', referenceAr: 'سورة النجم، الآية 40', referenceEn: 'An-Najm 53:40' },
    { ar: 'إِنَّا لَا نُضِيعُ أَجْرَ مَنْ أَحْسَنَ عَمَلًا', en: 'We never let the reward of those who do good work be lost.', referenceAr: 'سورة الكهف، الآية 30', referenceEn: 'Al-Kahf 18:30' },
    { ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', en: 'For indeed, with hardship comes ease.', referenceAr: 'سورة الشرح، الآية 6', referenceEn: 'Ash-Sharh 94:6' }
];

Object.assign(NuvioApp.prototype, {
    renderAll() {
        this.renderDashboard();
        this.populateFormOptions();

        if (this.currentSection === 'tasks') this.renderTasks();
        if (this.currentSection === 'calendar') this.renderCalendar();
        if (this.currentSection === 'reports') this.renderReports();
        if (this.currentSection === 'habits') this.renderHabits();
        if (this.currentSection === 'sleep') this.renderSleep();
        if (this.currentSection === 'water') this.renderWater();
                if (this.currentSection === 'notes') this.renderNotes();
        if (this.currentSection === 'prayer') { this.renderPrayerTimes(); this.updatePrayerCountdown(); }
                if (this.currentSection === 'focus') {
            // Rendering must not reset, pause, or restart the active timer.
            this.updateTimerDisplay?.();
            this.syncTimerButtons?.();
            this.renderFocusStats?.();
        }
    },

    renderDashboard() {
        const today = new Date().toDateString();
        const todayTasks = this.tasks.filter(task => {
            if (task.completedAt) {
                const completedAt = new Date(task.completedAt);
                return !Number.isNaN(completedAt.getTime()) && completedAt.toDateString() === today;
            }
            if (task.status === 'completed' || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return !Number.isNaN(dueDate.getTime()) && dueDate.toDateString() === today;
        });

        const completedToday = this.tasks.filter(t => 
            t.completedAt && new Date(t.completedAt).toDateString() === today
        ).length;

        const totalToday = todayTasks.length;
        const pendingToday = todayTasks.filter(t => t.status !== 'completed').length;
        const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

        const circle = document.getElementById('progressBar');
        if (circle) {
            const circumference = 2 * Math.PI * 52;
            const offset = circumference - (progressPercent / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }

        const pp = document.getElementById('progressPercent');
        if (pp) pp.textContent = progressPercent + '%';
        const cc = document.getElementById('completedCount');
        if (cc) cc.textContent = completedToday;
        const tc = document.getElementById('totalCount');
        if (tc) tc.textContent = totalToday;
        const pc = document.getElementById('pendingCount');
        if (pc) pc.textContent = pendingToday;

        const tdc = document.getElementById('todayCompleted');
        if (tdc) tdc.textContent = completedToday;

        const todayFocusTime = this.focusSessions
            .filter(s => new Date(s.date).toDateString() === today && s.type === 'pomodoro')
            .reduce((sum, s) => sum + s.duration, 0);
        const tft = document.getElementById('todayFocusTime');
        if (tft) tft.textContent = Math.round(todayFocusTime / 60 * 10) / 10 + 'h';

        const productivity = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
        const tp = document.getElementById('todayProductivity');
        if (tp) tp.textContent = productivity + '%';

        const totalSessions = this.focusSessions.length;
        const totalFocusTime = this.focusSessions
            .filter(s => s.type === 'pomodoro')
            .reduce((sum, s) => sum + s.duration, 0);

        const fs = document.getElementById('focusSessions');
        if (fs) fs.textContent = totalSessions;
        const ftt = document.getElementById('focusTotalTime');
        if (ftt) ftt.textContent = `${Math.floor(totalFocusTime / 60)}h ${totalFocusTime % 60}m`;

        const escapeHTML = window.NuvioSecurity.escapeHTML;
        const safeCategoryClass = value => this.categories[value] ? value : 'personal';
        const safePriorityClass = value => ['low', 'medium', 'high', 'urgent'].includes(value) ? value : 'medium';
        const activeTask = this.tasks.find(t => t.status === 'in-progress');
        const currentTaskContent = document.getElementById('currentTaskContent');

        if (activeTask && currentTaskContent) {
            currentTaskContent.innerHTML = `
                <div class="current-task-info">
                    <h4 style="font-size: 18px; margin-bottom: 8px; color: var(--text-primary);">${escapeHTML(activeTask.title)}</h4>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                        <span class="task-tag category-${safeCategoryClass(activeTask.category)}">${this.getCategoryLabel(activeTask.category)}</span>
                        <span class="task-tag priority-${safePriorityClass(activeTask.priority)}">${this.getPriorityLabel(activeTask.priority)}</span>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 12px;">${escapeHTML(activeTask.description || '')}</p>
                    <div style="display: flex; gap: 12px; font-size: 13px; color: var(--text-muted);">
                        <span><i class="fas fa-clock"></i> ${activeTask.estimatedTime} ${this.t('settings.minutes')}</span>
                        <span><i class="fas fa-hourglass-half"></i> ${activeTask.actualTime} ${this.t('settings.minutes')}</span>
                    </div>
                    <div style="margin-top: 16px; display: flex; gap: 8px;">
                        <button class="btn-primary" onclick="app.startTaskFocus('${window.NuvioSecurity.safeId(activeTask.id)}')">
                            <i class="fas fa-play"></i> ${this.t('timer.start')}
                        </button>
                        <button class="btn-outline" onclick="app.completeTask('${window.NuvioSecurity.safeId(activeTask.id)}')">
                            <i class="fas fa-check"></i> ${this.t('status.completed')}
                        </button>
                    </div>
                </div>
            `;
        } else if (currentTaskContent) {
            const pendingTasks = this.tasks.filter(t => t.status === 'pending');
            if (pendingTasks.length > 0) {
                const nextTask = pendingTasks[0];
                currentTaskContent.innerHTML = `
                    <div class="current-task-info">
                        <h4 style="font-size: 16px; margin-bottom: 8px; color: var(--text-secondary);">${this.t('dashboard.currentTask')}</h4>
                        <h4 style="font-size: 18px; margin-bottom: 8px; color: var(--text-primary);">${escapeHTML(nextTask.title)}</h4>
                        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <span class="task-tag category-${safeCategoryClass(nextTask.category)}">${this.getCategoryLabel(nextTask.category)}</span>
                        </div>
                        <button class="btn-primary" onclick="app.startTask('${window.NuvioSecurity.safeId(nextTask.id)}')">
                            <i class="fas fa-play"></i> ${this.t('timer.start')}
                        </button>
                    </div>
                `;
            } else {
                currentTaskContent.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>${this.t('dashboard.noActiveTask')}</p>
                        <button class="btn-outline" onclick="app.openTaskModal()">${this.t('actions.selectTask')}</button>
                    </div>
                `;
            }
        }

        this.renderWeeklyChart();
        const pb = document.getElementById('pendingBadge');
        if (pb) pb.textContent = this.tasks.filter(t => t.status === 'pending').length;

        if (!Number.isInteger(this.dashboardMotivationIndex)) {
            let previousIndex = -1;
            try {
                const savedIndex = sessionStorage.getItem('nuvio_dashboard_motivation_index');
                if (savedIndex !== null) previousIndex = Number(savedIndex);
            } catch (error) {
                console.warn('Could not read the previous dashboard motivation:', error);
            }
            const choices = dashboardMotivationQuotes
                .map((_, index) => index)
                .filter(index => index !== previousIndex);
            this.dashboardMotivationIndex = choices[Math.floor(Math.random() * choices.length)];
            try {
                sessionStorage.setItem('nuvio_dashboard_motivation_index', String(this.dashboardMotivationIndex));
            } catch (error) {
                console.warn('Could not save the dashboard motivation:', error);
            }
        }
        const quote = dashboardMotivationQuotes[this.dashboardMotivationIndex];
        const quoteText = document.getElementById('dashboardMotivationQuote');
        const quoteReference = document.getElementById('dashboardMotivationReference');
        if (quoteText) quoteText.textContent = this.settings.language === 'ar' ? quote.ar : quote.en;
        if (quoteReference) quoteReference.textContent = this.settings.language === 'ar' ? quote.referenceAr : quote.referenceEn;
        this.updateTimerDisplay?.();
    },

    getCategoryLabel(key) {
        const cat = this.categories[key];
        if (!cat) return key;
        return this.settings.language === 'ar' ? `${cat.icon} ${cat.nameAr}` : `${cat.icon} ${cat.nameEn}`;
    },

    getPriorityLabel(key) {
        const pri = this.priorities[key];
        if (!pri) return key;
        return this.settings.language === 'ar' ? pri.nameAr : pri.nameEn;
    },

    renderWeeklyChart() {
        const canvas = document.getElementById('weeklyCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = 20;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const isAr = this.settings.language === 'ar';
        const dayNames = isAr ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();

            const focusMinutes = this.focusSessions
                .filter(s => new Date(s.date).toDateString() === dateStr && s.type === 'pomodoro')
                .reduce((sum, s) => sum + s.duration, 0);

            const completedCount = this.tasks.filter(t => 
                t.completedAt && new Date(t.completedAt).toDateString() === dateStr
            ).length;

            days.push({
                name: dayNames[date.getDay()],
                focus: focusMinutes / 60,
                completed: completedCount
            });
        }

        const maxFocus = Math.max(...days.map(d => d.focus), 1);
        const maxCompleted = Math.max(...days.map(d => d.completed), 1);

        ctx.clearRect(0, 0, width, height);

        const barWidth = chartWidth / days.length / 3;
        const spacing = chartWidth / days.length;

        days.forEach((day, i) => {
            const x = padding + i * spacing + spacing / 2;

            const focusHeight = (day.focus / maxFocus) * chartHeight * 0.8;
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(x - barWidth - 2, height - padding - focusHeight, barWidth, focusHeight);

            const completedHeight = (day.completed / maxCompleted) * chartHeight * 0.8;
            ctx.fillStyle = '#10b981';
            ctx.fillRect(x + 2, height - padding - completedHeight, barWidth, completedHeight);

            ctx.fillStyle = '#6c757d';
            ctx.font = '12px Cairo';
            ctx.textAlign = 'center';
            ctx.fillText(day.name, x, height - 5);
        });
    },
});
