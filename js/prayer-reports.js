Object.assign(NuvioApp.prototype, {
    renderReports() {
        const period = document.getElementById('reportPeriod');
        const periodVal = period ? period.value : 'week';
        const now = new Date();
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (periodVal === 'week' ? 7 : 30));
        const isInRange = value => {
            const date = new Date(value);
            return !Number.isNaN(date.getTime()) && date >= startDate && date < endDate;
        };
        const periodTasks = this.tasks.filter(task => isInRange(task.createdAt));
        const completedTasks = periodTasks.filter(task => task.status === 'completed');
        const focusMinutes = this.focusSessions
            .filter(session => session.type === 'pomodoro' && isInRange(session.date))
            .reduce((sum, session) => sum + (Number(session.duration) || 0), 0);

        this.renderFocusHoursChart(startDate, endDate);
        this.renderCompletedTasksChart(completedTasks);
        this.renderActivityMap();

        const avgProductivity = periodTasks.length > 0
            ? Math.round((completedTasks.length / periodTasks.length) * 100)
            : 0;

        const mot = document.getElementById('moTotalTasks');
        const moc = document.getElementById('moCompleted');
        const mof = document.getElementById('moFocusHours');
        const moa = document.getElementById('moAvgProductivity');

        if (mot) mot.textContent = periodTasks.length;
        if (moc) moc.textContent = completedTasks.length;
        if (mof) mof.textContent = Math.round(focusMinutes / 60 * 10) / 10;
        if (moa) moa.textContent = avgProductivity + '%';
    },

    renderFocusHoursChart(startDate, endDate) {
        const canvas = document.getElementById('focusHoursChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const left = 38;
        const right = 10;
        const top = 14;
        const bottom = 25;
        const keyFor = date => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const hoursByDay = new Map();
        this.focusSessions.forEach(session => {
            if (session.type !== 'pomodoro') return;
            const date = new Date(session.date);
            if (Number.isNaN(date.getTime()) || date < startDate || date >= endDate) return;
            const key = keyFor(date);
            hoursByDay.set(key, (hoursByDay.get(key) || 0) + (Number(session.duration) || 0) / 60);
        });
        const days = [];
        for (const date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
            days.push({ date: new Date(date), hours: hoursByDay.get(keyFor(date)) || 0 });
        }
        const maxHours = Math.max(...days.map(day => day.hours), 1);

        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = this.settings.darkMode ? '#34373d' : '#e5e7eb';
        ctx.fillStyle = this.settings.darkMode ? '#a3a3a3' : '#6b7280';
        ctx.font = '11px Cairo, sans-serif';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const value = maxHours * i / 4;
            const y = height - bottom - (i / 4) * (height - top - bottom);
            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(width - right, y);
            ctx.stroke();
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toFixed(value % 1 ? 1 : 0), left - 7, y);
        }

        const plotWidth = width - left - right;
        const spacing = plotWidth / Math.max(days.length, 1);
        const barWidth = spacing * 0.66;
        days.forEach((day, i) => {
            const x = left + i * spacing + (spacing - barWidth) / 2;
            const barHeight = (day.hours / maxHours) * (height - top - bottom);
            const y = height - bottom - barHeight;
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(x, y, barWidth, barHeight);
            const labelStep = days.length <= 7 ? 1 : Math.ceil(days.length / 6);
            if (i % labelStep === 0 || i === days.length - 1) {
                ctx.fillStyle = this.settings.darkMode ? '#a3a3a3' : '#6b7280';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(String(day.date.getDate()), x + barWidth / 2, height - 5);
            }
        });
    },

    renderCompletedTasksChart(completedTasks) {
        const canvas = document.getElementById('completedTasksChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = 30;

        const categoryData = {};
        Object.keys(this.categories).forEach(cat => categoryData[cat] = 0);

        completedTasks.forEach(task => {
            const category = categoryData[task.category] !== undefined ? task.category : 'personal';
            categoryData[category] = (categoryData[category] || 0) + 1;
        });
        const legend = document.getElementById('completedTasksLegend');
        if (legend) {
            legend.replaceChildren();
            Object.entries(categoryData).filter(([, count]) => count > 0).forEach(([category, count]) => {
                const item = document.createElement('span');
                item.className = 'report-legend-item';
                const swatch = document.createElement('i');
                swatch.className = 'report-legend-swatch';
                swatch.style.backgroundColor = this.categories[category].color;
                const name = this.settings.language === 'ar'
                    ? this.categories[category].nameAr
                    : this.categories[category].nameEn;
                item.append(swatch, document.createTextNode(`${name} (${count})`));
                legend.appendChild(item);
            });
        }

        const total = Object.values(categoryData).reduce((a, b) => a + b, 0);
        if (total === 0) {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = this.settings.darkMode ? '#737373' : '#6c757d';
            ctx.font = '14px Cairo, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.settings.language === 'ar' ? 'لا توجد مهام مكتملة في الفترة' : 'No completed tasks in this period', width / 2, height / 2);
            return;
        }

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - padding;

        let currentAngle = -Math.PI / 2;

        Object.entries(categoryData).forEach(([cat, count]) => {
            if (count === 0) return;

            const angle = (count / total) * 2 * Math.PI;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
            ctx.closePath();
            ctx.fillStyle = this.categories[cat].color;
            ctx.fill();

            currentAngle += angle;
        });

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = this.settings.darkMode ? '#141414' : '#ffffff';
        ctx.fill();

        ctx.fillStyle = this.settings.darkMode ? '#f5f5f5' : '#1a1a1a';
        ctx.font = 'bold 20px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, centerX, centerY - 5);
        ctx.font = '12px Cairo, sans-serif';
        ctx.fillStyle = this.settings.darkMode ? '#a3a3a3' : '#6c757d';
        ctx.fillText(this.settings.language === 'ar' ? 'مهمة' : 'Tasks', centerX, centerY + 15);
    },

    renderActivityMap() {
        const container = document.getElementById('activityMap');
        if (!container) return;

        container.innerHTML = '';

        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 365);

        for (let week = 0; week < 53; week++) {
            for (let day = 0; day < 7; day++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + week * 7 + day);

                if (date > now) continue;

                const dateStr = date.toDateString();
                const sessions = this.focusSessions.filter(s => 
                    new Date(s.date).toDateString() === dateStr && s.type === 'pomodoro'
                ).length;

                const cell = document.createElement('div');
                cell.className = 'activity-cell';
                if (sessions >= 4) cell.classList.add('level-4');
                else if (sessions >= 3) cell.classList.add('level-3');
                else if (sessions >= 2) cell.classList.add('level-2');
                else if (sessions >= 1) cell.classList.add('level-1');

                cell.title = `${date.toLocaleDateString(this.settings.language === 'ar' ? 'ar-SA' : 'en-US')}: ${sessions} ${this.settings.language === 'ar' ? 'جلسة' : 'sessions'}`;
                container.appendChild(cell);
            }
        }
    },

    updateReports() {
        this.renderReports();
    },

    async loadPrayerTimes() {
        const citySelect = document.getElementById('prayerCity');
        const methodSelect = document.getElementById('prayerMethod');

        if (citySelect) this.prayerData.city = citySelect.value;
        if (methodSelect) this.prayerData.method = methodSelect.value;

        this.savePrayerSettings();

        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        try {
            const response = await fetch(
                `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${this.prayerData.city}&country=&method=${this.prayerData.method}`
            );
            const data = await response.json();

            if (data.code === 200 && data.data) {
                this.prayerData.times = data.data.timings;
                this.prayerData.hijriDate = data.data.date.hijri;
                this.renderPrayerTimes();
                this.updatePrayerCountdown();
            } else {
                this.showToast(this.t('prayer.error'), 'error');
            }
        } catch (e) {
            console.error('Error fetching prayer times:', e);
            this.showToast(this.t('prayer.error'), 'error');
        }
    },

    renderPrayerTimes() {
        if (!this.prayerData.times) return;

        const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const ids = ['timeFajr', 'timeSunrise', 'timeDhuhr', 'timeAsr', 'timeMaghrib', 'timeIsha'];

        prayers.forEach((prayer, i) => {
            const el = document.getElementById(ids[i]);
            if (el && this.prayerData.times[prayer]) {
                el.textContent = this.prayerData.times[prayer];
            }
        });

        // Update hijri date
        if (this.prayerData.hijriDate) {
            const hijri = this.prayerData.hijriDate;
            const hijriText = this.settings.language === 'ar'
                ? `${hijri.day} ${hijri.month.ar} ${hijri.year}هـ`
                : `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
            const gregEl = document.getElementById('gregorianDate');
            const hijriEl = document.getElementById('hijriDate');
            if (hijriEl) hijriEl.textContent = hijriText;
            if (gregEl) {
                const now = new Date();
                gregEl.textContent = now.toLocaleDateString(this.settings.language === 'ar' ? 'ar-SA' : 'en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });
            }
        }
    },

    updatePrayerCountdown() {
        if (!this.prayerData.times) return;

        const now = new Date();
        const prayers = [
            { name: this.t('prayer.fajr'), key: 'Fajr' },
            { name: this.t('prayer.sunrise'), key: 'Sunrise' },
            { name: this.t('prayer.dhuhr'), key: 'Dhuhr' },
            { name: this.t('prayer.asr'), key: 'Asr' },
            { name: this.t('prayer.maghrib'), key: 'Maghrib' },
            { name: this.t('prayer.isha'), key: 'Isha' }
        ];

        let nextPrayer = null;
        let nextTime = null;
        let prevTime = null;

        for (const prayer of prayers) {
            const timeStr = this.prayerData.times[prayer.key];
            if (!timeStr) continue;

            const [hours, minutes] = timeStr.split(':').map(Number);
            const prayerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

            if (prayerTime > now) {
                if (!nextPrayer || prayerTime < nextTime) {
                    nextPrayer = prayer;
                    nextTime = prayerTime;
                }
            }
        }

        // If no next prayer today, next is Fajr tomorrow
        if (!nextPrayer) {
            const fajrStr = this.prayerData.times['Fajr'];
            if (fajrStr) {
                const [hours, minutes] = fajrStr.split(':').map(Number);
                nextTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, minutes, 0);
                nextPrayer = { name: this.t('prayer.fajr'), key: 'Fajr' };
            }
        }

        // Find previous prayer for progress bar
        for (const prayer of prayers) {
            const timeStr = this.prayerData.times[prayer.key];
            if (!timeStr) continue;
            const [hours, minutes] = timeStr.split(':').map(Number);
            const prayerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
            if (prayerTime <= now) {
                prevTime = prayerTime;
            }
        }

        if (nextPrayer && nextTime) {
            const diff = nextTime - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const npn = document.getElementById('nextPrayerName');
            const npc = document.getElementById('nextPrayerCountdown');
            if (npn) npn.textContent = nextPrayer.name;
            if (npc) npc.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            // Update progress bar
            if (prevTime) {
                const totalDuration = nextTime - prevTime;
                const elapsed = now - prevTime;
                const progress = Math.min((elapsed / totalDuration) * 100, 100);
                const bar = document.getElementById('prayerProgressBar');
                if (bar) bar.style.width = progress + '%';
            }

            // Highlight active prayer card
            document.querySelectorAll('.prayer-time-card').forEach(card => {
                card.classList.remove('active');
            });
            const activeCard = document.querySelector(`[data-prayer="${nextPrayer.key}"]`);
            if (activeCard) activeCard.classList.add('active');
        }
    },

    startPrayerCountdown() {
        if (this.prayerCountdownInterval) clearInterval(this.prayerCountdownInterval);
        this.prayerCountdownInterval = setInterval(() => {
            this.updatePrayerCountdown();
        }, 1000);
    },

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showToast(this.t('prayer.locationError'), 'error');
            return;
        }

        this.showToast(this.t('prayer.loading'), 'info');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const data = await response.json();
                    const city = data.city || data.locality || 'Cairo';

                    const citySelect = document.getElementById('prayerCity');
                    // Try to find matching option
                    let found = false;
                    if (citySelect) {
                        for (let i = 0; i < citySelect.options.length; i++) {
                            if (citySelect.options[i].text.includes(city) || city.includes(citySelect.options[i].text)) {
                                citySelect.selectedIndex = i;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            // Add custom option
                            const option = document.createElement('option');
                            option.value = encodeURIComponent(city);
                            option.text = city;
                            citySelect.insertBefore(option, citySelect.firstChild);
                            citySelect.selectedIndex = 0;
                        }
                    }

                    this.loadPrayerTimes();
                    this.showToast(city + ' - ' + this.t('prayer.location'), 'success');
                } catch (e) {
                    this.showToast(this.t('prayer.locationError'), 'error');
                }
            },
            () => {
                this.showToast(this.t('prayer.locationError'), 'error');
            }
        );
    },
});
