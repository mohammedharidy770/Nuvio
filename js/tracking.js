Object.assign(NuvioApp.prototype, {
    openSleepModal(recordId = null) {
        const modal = document.getElementById('sleepModal');
        const overlay = document.getElementById('sleepModalOverlay');
        const form = document.getElementById('sleepForm');

        if (form) form.reset();
        const sid = document.getElementById('sleepId');
        if (sid) sid.value = '';

        // Set default times
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 0, 0, 0);
        
        const bt = document.getElementById('sleepBedTime');
        const wt = document.getElementById('sleepWakeTime');
        if (bt) bt.value = this.toDateTimeLocal(yesterday);
        if (wt) wt.value = this.toDateTimeLocal(now);

        if (recordId) {
            const record = this.sleepRecords.find(r => r.id === recordId);
            if (record) {
                if (sid) sid.value = record.id;
                if (bt) bt.value = this.toDateTimeLocal(new Date(record.bedTime));
                if (wt) wt.value = this.toDateTimeLocal(new Date(record.wakeTime));
                const sn = document.getElementById('sleepNotes');
                if (sn) sn.value = record.notes || '';
                document.querySelectorAll('#sleepQualitySelector input').forEach(cb => {
                    cb.checked = cb.value === String(record.quality);
                });
            }
        }

        if (modal) modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeSleepModal() {
        const modal = document.getElementById('sleepModal');
        const overlay = document.getElementById('sleepModalOverlay');
        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    },

    toDateTimeLocal(date) {
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    },

    saveSleepRecord(e) {
        e.preventDefault();

        const recordId = document.getElementById('sleepId').value;
        const bedTime = new Date(document.getElementById('sleepBedTime').value);
        const wakeTime = new Date(document.getElementById('sleepWakeTime').value);
        const quality = parseInt(document.querySelector('#sleepQualitySelector input:checked')?.value || '3');
        const notes = document.getElementById('sleepNotes')?.value.trim() || '';

        const hours = (wakeTime - bedTime) / (1000 * 60 * 60);
        if (hours <= 0 || hours > 24) {
            this.showToast(this.settings.language === 'ar' ? 'وقت غير صحيح' : 'Invalid time', 'error');
            return;
        }

        if (recordId) {
            const index = this.sleepRecords.findIndex(r => r.id === recordId);
            if (index !== -1) {
                this.sleepRecords[index] = {
                    ...this.sleepRecords[index],
                    bedTime: bedTime.toISOString(),
                    wakeTime: wakeTime.toISOString(),
                    hours, quality, notes
                };
            }
        } else {
            this.sleepRecords.unshift({
                id: 'sleep-' + Date.now(),
                bedTime: bedTime.toISOString(),
                wakeTime: wakeTime.toISOString(),
                hours, quality, notes,
                createdAt: new Date().toISOString()
            });
        }

        this.saveSleepRecords();
        this.closeSleepModal();
        this.renderSleep();
        this.showToast(this.t('sleep.saved'), 'success');
    },

    deleteSleepRecord(recordId) {
        if (!confirm(this.t('sleep.deleteConfirm'))) return;
        this.sleepRecords = this.sleepRecords.filter(r => r.id !== recordId);
        this.saveSleepRecords();
        this.renderSleep();
        this.showToast(this.t('sleep.deleted'), 'success');
    },

    renderSleep() {
        const chart = document.getElementById('sleepChart');
        const list = document.getElementById('sleepList');
        const empty = document.getElementById('sleepEmpty');

        // Stats
        const totalNights = this.sleepRecords.length;
        const avgHours = totalNights > 0 
            ? (this.sleepRecords.reduce((s, r) => s + r.hours, 0) / totalNights).toFixed(1) 
            : 0;
        const avgQuality = totalNights > 0 
            ? Math.round(this.sleepRecords.reduce((s, r) => s + r.quality, 0) / totalNights * 25) 
            : 0;

        const ah = document.getElementById('sleepAvgHours');
        const aq = document.getElementById('sleepQualityAvg');
        const tn = document.getElementById('sleepTotalNights');
        if (ah) ah.textContent = avgHours + 'h';
        if (aq) aq.textContent = avgQuality + '%';
        if (tn) tn.textContent = totalNights;

        if (totalNights === 0) {
            if (chart) chart.style.display = 'none';
            if (list) list.style.display = 'none';
            if (empty) empty.style.display = 'block';
            return;
        }

        if (chart) chart.style.display = 'flex';
        if (list) list.style.display = 'flex';
        if (empty) empty.style.display = 'none';

        // Chart - last 7 days
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toDateString();
            const record = this.sleepRecords.find(r => new Date(r.bedTime).toDateString() === dateStr);
            days.push({
                label: d.toLocaleDateString(this.settings.language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' }),
                hours: record ? record.hours : 0,
                max: 12
            });
        }

        if (chart) {
            chart.innerHTML = days.map(d => `
                <div class="sleep-bar" style="height: ${(d.hours / d.max * 100)}%;">
                    <span class="sleep-bar-value">${d.hours > 0 ? d.hours.toFixed(1) : ''}</span>
                    <span class="sleep-bar-label">${d.label}</span>
                </div>
            `).join('');
        }

        // List
        if (list) {
            list.innerHTML = this.sleepRecords.slice(0, 10).map(r => {
                const bed = new Date(r.bedTime);
                const wake = new Date(r.wakeTime);
                const dateStr = bed.toLocaleDateString(this.settings.language === 'ar' ? 'ar-SA' : 'en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                });
                const qualityIcons = [1, 2, 3, 4].map(i => 
                    `<i class="fas fa-star ${i <= r.quality ? 'active' : ''}"></i>`
                ).join('');

                return `
                    <div class="sleep-item">
                        <div class="sleep-item-icon"><i class="fas fa-moon"></i></div>
                        <div class="sleep-item-info">
                            <div class="sleep-item-date">${dateStr}</div>
                            <div class="sleep-item-hours">${r.hours.toFixed(1)} ${this.t('sleep.hours')} · ${bed.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${wake.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                        <div class="sleep-item-quality">${qualityIcons}</div>
                        <div class="sleep-item-actions">
                            <button onclick="app.openSleepModal('${r.id}')"><i class="fas fa-edit"></i></button>
                            <button class="delete" onclick="app.deleteSleepRecord('${r.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    updateWaterGoal(value) {
        const num = parseInt(value);
        if (num && num > 0) {
            this.waterData.goal = num;
            this.saveWaterData();
            this.renderWater();
        }
    },

    addWaterGlass() {
        this.waterData.today++;
        this.saveWaterData();
        this.renderWater();
        
        if (this.waterData.today >= this.waterData.goal) {
            this.showToast(this.t('water.congrats'), 'success');
        }
    },

    removeWaterGlass() {
        if (this.waterData.today > 0) {
            this.waterData.today--;
            this.saveWaterData();
            this.renderWater();
        }
    },

    toggleWaterReminder() {
        const toggle = document.getElementById('waterReminderToggle');
        this.waterData.reminder = toggle ? toggle.checked : false;
        this.saveWaterData();
        
        if (this.waterData.reminder) {
            this.startWaterReminder();
        } else {
            this.stopWaterReminder();
        }
    },

    startWaterReminder() {
        if (this.waterReminderInterval) clearInterval(this.waterReminderInterval);
        if (!this.waterData.reminder) return;
        
        this.waterReminderInterval = setInterval(() => {
            const today = new Date().toDateString();
            if (this.waterData.lastDate !== today) {
                this.waterData.history[this.waterData.lastDate] = this.waterData.today;
                this.waterData.today = 0;
                this.waterData.lastDate = today;
                this.saveWaterData();
                this.renderWater();
            }
            
            if (this.waterData.today < this.waterData.goal) {
                this.showToast(this.settings.language === 'ar' ? 'تذكير: اشرب كوب مياه!' : 'Reminder: Drink water!', 'info');
            }
        }, 60 * 60 * 1000); // Every hour
    },

    stopWaterReminder() {
        if (this.waterReminderInterval) {
            clearInterval(this.waterReminderInterval);
            this.waterReminderInterval = null;
        }
    },

    renderWater() {
        const current = document.getElementById('waterCurrent');
        const goal = document.getElementById('waterGoal');
        const percent = document.getElementById('waterPercent');
        const level = document.getElementById('waterLevel');
        const goalInput = document.getElementById('waterGoalInput');
        const reminderToggle = document.getElementById('waterReminderToggle');
        const weekly = document.getElementById('waterWeekly');

        const percentage = Math.min((this.waterData.today / this.waterData.goal) * 100, 100);

        if (current) current.textContent = this.waterData.today;
        if (goal) goal.textContent = this.waterData.goal;
        if (percent) percent.textContent = Math.round(percentage) + '%';
        if (level) level.style.height = percentage + '%';
        if (goalInput) goalInput.value = this.waterData.goal;
        if (reminderToggle) reminderToggle.checked = this.waterData.reminder;

        // Weekly chart
        if (weekly) {
            const days = [];
            const dayNames = this.settings.language === 'ar' 
                ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] 
                : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toDateString();
                const count = i === 0 ? this.waterData.today : (this.waterData.history[dateStr] || 0);
                days.push({
                    label: dayNames[d.getDay()],
                    count,
                    percent: Math.min((count / this.waterData.goal) * 100, 100)
                });
            }

            weekly.innerHTML = `
                <div class="water-weekly-title"><i class="fas fa-chart-bar"></i> ${this.settings.language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</div>
                <div class="water-week-grid">
                    ${days.map(d => `
                        <div class="water-day">
                            <div class="water-day-label">${d.label}</div>
                            <div class="water-day-bar">
                                <div class="water-day-fill" style="height: ${d.percent}%;"></div>
                            </div>
                            <div class="water-day-value">${d.count}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    },

    openNoteModal(noteId = null) {
        const modal = document.getElementById('noteModal');
        const overlay = document.getElementById('noteModalOverlay');
        const form = document.getElementById('noteForm');
        const title = document.getElementById('noteModalTitle');

        if (form) form.reset();
        const nid = document.getElementById('noteId');
        if (nid) nid.value = '';

        // Reset color to first option
        document.querySelectorAll('#noteColors input').forEach((cb, i) => cb.checked = i === 0);

        if (noteId) {
            const note = this.notes.find(n => n.id === noteId);
            if (note) {
                if (title) title.textContent = this.t('notes.editNote');
                if (nid) nid.value = note.id;
                const nt = document.getElementById('noteTitle');
                if (nt) nt.value = note.title;
                const nc = document.getElementById('noteContent');
                if (nc) nc.value = note.content || '';
                const ntags = document.getElementById('noteTags');
                if (ntags) ntags.value = note.tags ? note.tags.join(', ') : '';
                
                // Set color
                document.querySelectorAll('#noteColors input').forEach(cb => {
                    cb.checked = cb.value === note.color;
                });
            }
        } else {
            if (title) title.textContent = this.t('notes.newNote');
        }

        if (modal) modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeNoteModal() {
        const modal = document.getElementById('noteModal');
        const overlay = document.getElementById('noteModalOverlay');
        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    },

    saveNote(e) {
        e.preventDefault();

        const noteId = document.getElementById('noteId').value;
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();
        const tagsStr = document.getElementById('noteTags').value;
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
        const color = document.querySelector('#noteColors input:checked')?.value || '#fef3c7';

        if (!title) {
            this.showToast(this.t('notes.titlePlaceholder'), 'warning');
            return;
        }

        if (noteId) {
            const index = this.notes.findIndex(n => n.id === noteId);
            if (index !== -1) {
                this.notes[index] = {
                    ...this.notes[index],
                    title, content, tags, color,
                    updatedAt: new Date().toISOString()
                };
                this.showToast(this.t('notes.updated'), 'success');
            }
        } else {
            const newNote = {
                id: 'note-' + Date.now(),
                title, content, tags, color,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.notes.unshift(newNote);
            this.showToast(this.t('notes.saved'), 'success');
        }

        this.saveNotes();
        this.closeNoteModal();
        this.renderNotes();
    },

    deleteNote(noteId) {
        if (!confirm(this.t('notes.deleteConfirm'))) return;
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.saveNotes();
        this.renderNotes();
        this.showToast(this.t('notes.deleted'), 'success');
    },

    searchNotes() {
        this.renderNotes();
    },

    filterNotesByTag(tag) {
        this.currentNoteTag = tag;
        this.renderNotes();
    },

    renderNotes() {
        const grid = document.getElementById('notesGrid');
        const empty = document.getElementById('notesEmpty');
        const tagsFilter = document.getElementById('notesTagsFilter');
        const searchInput = document.getElementById('notesSearch');

        if (!grid) return;

        // Get all unique tags
        const allTags = new Set();
        this.notes.forEach(n => n.tags.forEach(t => allTags.add(t)));

        // Render tags filter
        if (tagsFilter) {
            let tagsHtml = `<button class="note-tag-filter ${this.currentNoteTag === 'all' ? 'active' : ''}" onclick="app.filterNotesByTag('all')">الكل</button>`;
            Array.from(allTags).sort().forEach(tag => {
                tagsHtml += `<button class="note-tag-filter ${this.currentNoteTag === tag ? 'active' : ''}" onclick="app.filterNotesByTag('${tag}')">${tag}</button>`;
            });
            tagsFilter.innerHTML = tagsHtml;
        }

        // Filter notes
        let filtered = [...this.notes];
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        if (searchTerm) {
            filtered = filtered.filter(n => 
                n.title.toLowerCase().includes(searchTerm) || 
                n.content.toLowerCase().includes(searchTerm) ||
                n.tags.some(t => t.toLowerCase().includes(searchTerm))
            );
        }

        if (this.currentNoteTag !== 'all') {
            filtered = filtered.filter(n => n.tags.includes(this.currentNoteTag));
        }

        if (filtered.length === 0) {
            if (grid) grid.style.display = 'none';
            if (empty) empty.style.display = 'block';
            return;
        }

        if (grid) {
            grid.style.display = 'grid';
            grid.innerHTML = filtered.map(note => this.renderNoteCard(note)).join('');
        }
        if (empty) empty.style.display = 'none';
    },

    renderNoteCard(note) {
        const isAr = this.settings.language === 'ar';
        const date = new Date(note.updatedAt || note.createdAt);
        const dateStr = date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
            month: 'short', day: 'numeric'
        });

        return `
            <div class="note-card" style="--note-color: ${note.color};" onclick="app.openNoteModal('${note.id}')">
                <div class="note-card-header">
                    <div class="note-card-title">${note.title}</div>
                    <div class="note-card-date">${dateStr}</div>
                </div>
                <div class="note-card-content">${note.content || ''}</div>
                <div class="note-card-tags">
                    ${note.tags.map(tag => `<span class="note-card-tag">${tag}</span>`).join('')}
                </div>
                <div class="note-card-actions" onclick="event.stopPropagation()">
                    <button onclick="app.openNoteModal('${note.id}')" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="delete" onclick="app.deleteNote('${note.id}')" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    },
});
