Object.assign(NuvioApp.prototype, {
    renderReports() {
        const period = document.getElementById('reportPeriod');
        const periodVal = period ? period.value : 'week';
        const now = new Date();
        let startDate = new Date();

        if (periodVal === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else {
            startDate.setMonth(startDate.getMonth() - 1);
        }

        this.renderFocusHoursChart(startDate, now);
        this.renderCompletedTasksChart(startDate, now);
        this.renderActivityMap();

        const monthTasks = this.tasks.filter(t => new Date(t.createdAt) >= startDate);
        const monthCompleted = monthTasks.filter(t => t.status === 'completed').length;
        const monthFocusHours = this.focusSessions
            .filter(s => new Date(s.date) >= startDate && s.type === 'pomodoro')
            .reduce((sum, s) => sum + s.duration, 0) / 60;
        const avgProductivity = monthTasks.length > 0 ? Math.round((monthCompleted / monthTasks.length) * 100) : 0;

        const mot = document.getElementById('moTotalTasks');
        const moc = document.getElementById('moCompleted');
        const mof = document.getElementById('moFocusHours');
        const moa = document.getElementById('moAvgProductivity');

        if (mot) mot.textContent = monthTasks.length;
        if (moc) moc.textContent = monthCompleted;
        if (mof) mof.textContent = Math.round(monthFocusHours * 10) / 10;
        if (moa) moa.textContent = avgProductivity + '%';
    },

    renderFocusHoursChart(startDate, endDate) {
        const canvas = document.getElementById('focusHoursChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = 30;

        const days = [];
        const dayCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        for (let i = 0; i <= dayCount; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toDateString();

            const hours = this.focusSessions
                .filter(s => new Date(s.date).toDateString() === dateStr && s.type === 'pomodoro')
                .reduce((sum, s) => sum + s.duration, 0) / 60;

            days.push(hours);
        }

        const maxHours = Math.max(...days, 1);

        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = this.settings.darkMode ? '#262626' : '#dee2e6';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = height - padding - (i / 4) * (height - padding * 2);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        const barWidth = (width - padding * 2) / days.length * 0.7;
        const spacing = (width - padding * 2) / days.length;

        days.forEach((hours, i) => {
            const x = padding + i * spacing + (spacing - barWidth) / 2;
            const barHeight = (hours / maxHours) * (height - padding * 2);
            const y = height - padding - barHeight;

            ctx.fillStyle = '#dc2626';
            ctx.fillRect(x, y, barWidth, barHeight);
        });
    },

    renderCompletedTasksChart(startDate, endDate) {
        const canvas = document.getElementById('completedTasksChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = 30;

        const categoryData = {};
        Object.keys(this.categories).forEach(cat => categoryData[cat] = 0);

        this.tasks.filter(t => t.status === 'completed' && new Date(t.completedAt) >= startDate)
            .forEach(t => {
                if (categoryData[t.category] !== undefined) {
                    categoryData[t.category]++;
                }
            });

        const total = Object.values(categoryData).reduce((a, b) => a + b, 0);
        if (total === 0) {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = this.settings.darkMode ? '#737373' : '#6c757d';
            ctx.font = '14px Cairo';
            ctx.textAlign = 'center';
            ctx.fillText(this.settings.language === 'ar' ? 'لا توجد بيانات' : 'No data', width / 2, height / 2);
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
        ctx.font = 'bold 20px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, centerX, centerY - 5);
        ctx.font = '12px Cairo';
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
