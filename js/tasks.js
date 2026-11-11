Object.assign(NuvioApp.prototype, {
    renderTasks() {
        const list = document.getElementById('tasksList');
        const empty = document.getElementById('tasksEmpty');

        const dateKey = value => {
            if (!value) return '';
            const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value));
            if (match) return match[1];
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? '' : [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
        };
        const today = dateKey(new Date());

        let filtered = [...this.tasks];

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(t => {
                if (this.currentFilter === 'overdue') {
                    return t.dueDate && dateKey(t.dueDate) < today && t.status !== 'completed';
                }
                return t.status === this.currentFilter;
            });
        }

        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'priority':
                    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'due-date':
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'estimated-time':
                    return b.estimatedTime - a.estimatedTime;
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        if (filtered.length === 0) {
            if (list) list.style.display = 'none';
            if (empty) empty.style.display = 'block';
            return;
        }

        if (list) {
            list.style.display = 'flex';
            list.innerHTML = filtered.map(task => this.renderTaskItem(task)).join('');
        }
        if (empty) empty.style.display = 'none';
    },

    renderTaskItem(task) {
        const escapeHTML = window.NuvioSecurity.escapeHTML;
        const safeId = window.NuvioSecurity.safeId(task.id);
        const category = this.categories[task.category] ? task.category : 'personal';
        const priority = ['low', 'medium', 'high', 'urgent'].includes(task.priority) ? task.priority : 'medium';
        const dateKey = value => {
            if (!value) return '';
            const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value));
            if (match) return match[1];
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? '' : [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
        };
        const todayDate = new Date();
        const todayKey = dateKey(todayDate);
        const tomorrowDate = new Date(todayDate);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowKey = dateKey(tomorrowDate);
        const taskDateKey = dateKey(task.dueDate);
        const isOverdue = Boolean(task.dueDate && taskDateKey < todayKey && task.status !== 'completed');

        let dueText = '';
        if (task.dueDate && taskDateKey) {
            const isAr = this.settings.language === 'ar';
            if (taskDateKey < todayKey) {
                const due = new Date(taskDateKey + 'T12:00:00');
                const today = new Date(todayKey + 'T12:00:00');
                const days = Math.round((today - due) / 86400000);
                dueText = isAr ? 'متأخر ' + days + ' يوم' : days + ' days overdue';
            } else if (taskDateKey === todayKey) dueText = isAr ? 'اليوم' : 'Today';
            else if (taskDateKey === tomorrowKey) dueText = isAr ? 'غداً' : 'Tomorrow';
            else {
                const due = new Date(taskDateKey + 'T12:00:00');
                const today = new Date(todayKey + 'T12:00:00');
                const days = Math.round((due - today) / 86400000);
                dueText = isAr ? 'بعد ' + days + ' يوم' : 'In ' + days + ' days';
            }
        }

        return `
            <div class="task-item" onclick="app.showTaskDetails('${safeId}')">
                <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                     onclick="event.stopPropagation(); app.toggleTaskComplete('${safeId}')">
                    ${task.status === 'completed' ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title ${task.status === 'completed' ? 'completed' : ''}">${escapeHTML(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-tag category-${category}">${this.getCategoryLabel(task.category)}</span>
                        <span class="task-tag priority-${priority}">${this.getPriorityLabel(task.priority)}</span>
                        ${dueText ? `<span class="task-due ${isOverdue ? 'overdue' : ''} ${taskDateKey === todayKey ? 'today' : ''}"><i class="fas fa-calendar"></i> ${dueText}</span>` : ''}
                        <span class="task-estimated"><i class="fas fa-clock"></i> ${task.estimatedTime} ${this.t('settings.minutes')}</span>
                        ${task.tags.map(tag => `<span class="task-tag" style="background: var(--bg-tertiary); color: var(--text-muted);">${escapeHTML(tag)}</span>`).join('')}
                    </div>
                </div>
                <div class="task-actions">
                    ${task.status !== 'completed' ? `
                        <button class="task-action-btn" onclick="event.stopPropagation(); app.startTask('${safeId}')" title="${this.t('timer.start')}">
                            <i class="fas fa-play"></i>
                        </button>
                    ` : ''}
                    <button class="task-action-btn" onclick="event.stopPropagation(); app.editTask('${safeId}')" title="${this.t('actions.cancel')}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" onclick="event.stopPropagation(); app.deleteTask('${safeId}')" title="${this.t('actions.clearAll')}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },

    sortTasks() {
        this.currentSort = document.getElementById('sortTasks').value;
        this.renderTasks();
    },

    openTaskModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const overlay = document.getElementById('taskModalOverlay');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('taskModalTitle');

        if (form) form.reset();
        const tid = document.getElementById('taskId');
        if (tid) tid.value = '';
        this.populateFormOptions();

        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                if (title) title.textContent = this.t('modal.editTask');
                if (tid) tid.value = task.id;
                const tt = document.getElementById('taskTitle');
                if (tt) tt.value = task.title;
                const td = document.getElementById('taskDescription');
                if (td) td.value = task.description || '';
                const tc = document.getElementById('taskCategory');
                if (tc) tc.value = task.category;
                const tp = document.getElementById('taskPriority');
                if (tp) tp.value = task.priority;
                const tdd = document.getElementById('taskDueDate');
                if (tdd)  tdd.value = task.dueDate ? (() => {
                    const due = new Date(task.dueDate);
                    const pad = value => String(value).padStart(2, '0');
                    return due.getFullYear() + '-' + pad(due.getMonth() + 1) + '-' + pad(due.getDate()) + 'T' + pad(due.getHours()) + ':' + pad(due.getMinutes());
                })() : '';
                const tet = document.getElementById('taskEstimatedTime');
                if (tet) tet.value = task.estimatedTime;
                const tr = document.getElementById('taskRepeat');
                if (tr) tr.value = task.repeat || 'none';
                const tmr = document.getElementById('taskReminderSelect');
                if (tmr) tmr.value = task.reminder || '0';
                const ttg = document.getElementById('taskTags');
                if (ttg) ttg.value = task.tags ? task.tags.join(', ') : '';
            }
        } else {
            if (title) title.textContent = this.t('modal.newTask');
            const tet = document.getElementById('taskEstimatedTime');
            if (tet) tet.value = this.settings.pomodoroDuration;
        }

        if (modal) modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        const overlay = document.getElementById('taskModalOverlay');
        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    },

    saveTask(e) {
        e.preventDefault();

        const taskId = document.getElementById('taskId').value;
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const category = document.getElementById('taskCategory').value;
        const priority = document.getElementById('taskPriority').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const estimatedTime = parseInt(document.getElementById('taskEstimatedTime').value) || 25;
        const repeat = document.getElementById('taskRepeat').value;
        const reminder = parseInt(document.getElementById('taskReminderSelect').value) || 0;
        const tagsStr = document.getElementById('taskTags').value;
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];

        if (!title) {
            this.showToast(this.t('form.taskTitlePlaceholder'), 'warning');
            return;
        }

        if (taskId) {
            const index = this.tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                this.tasks[index] = {
                    ...this.tasks[index],
                    title, description, category, priority,
                    dueDate: dueDate || null, estimatedTime, repeat, reminder, tags
                };
                this.showToast(this.settings.language === 'ar' ? 'تم تحديث المهمة' : 'Task updated', 'success');
            }
        } else {
            const newTask = {
                id: 'task-' + Date.now(),
                title, description, category, priority,
                status: 'pending',
                dueDate: dueDate || null,
                estimatedTime, actualTime: 0, repeat, reminder, tags,
                createdAt: new Date().toISOString(),
                completedAt: null
            };
            this.tasks.unshift(newTask);
            this.showToast(this.settings.language === 'ar' ? 'تم إضافة المهمة' : 'Task added', 'success');

            if (dueDate && reminder > 0) {
                this.addNotification('task', `${this.t('form.reminder')}: ${title}`, new Date(new Date(dueDate).getTime() - reminder * 60000));
            }
        }

        this.saveData();
        this.closeTaskModal();
        this.renderAll();
    },

    editTask(taskId) {
        this.openTaskModal(taskId);
    },

    deleteTask(taskId) {
        const msg = this.settings.language === 'ar' ? 'هل أنت متأكد من حذف هذه المهمة؟' : 'Are you sure you want to delete this task?';
        if (!confirm(msg)) return;

        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData();
        this.renderAll();
        this.showToast(this.settings.language === 'ar' ? 'تم حذف المهمة' : 'Task deleted', 'success');
    },

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (task.status === 'completed') {
            task.status = 'pending';
            task.completedAt = null;
            this.showToast(this.settings.language === 'ar' ? 'تم إلغاء الإكمال' : 'Completion cancelled', 'info');
        } else {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
            this.showToast(this.settings.language === 'ar' ? 'تم إكمال المهمة! أحسنت' : 'Task completed! Great job', 'success');
            this.addNotification('focus', `${this.settings.language === 'ar' ? 'أحسنت! أكملت' : 'Great! Completed'}: ${task.title}`);
        }

        this.saveData();
        this.renderAll();
    },

    startTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.tasks.forEach(t => {
            if (t.status === 'in-progress') t.status = 'pending';
        });

        task.status = 'in-progress';
        this.saveData();
        this.renderAll();
        this.showToast(`${this.t('timer.start')}: ${task.title}`, 'success');
    },

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.actualTime = task.estimatedTime;
        this.saveData();
        this.renderAll();
        this.showToast(this.settings.language === 'ar' ? 'تم إكمال المهمة! أحسنت' : 'Task completed! Great job', 'success');
    },

    showTaskDetails(taskId) {
        const escapeHTML = window.NuvioSecurity.escapeHTML;
        const safeId = window.NuvioSecurity.safeId(taskId);
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        const safeCategory = this.categories[task.category] ? task.category : 'personal';
        const safePriority = ['low', 'medium', 'high', 'urgent'].includes(task.priority) ? task.priority : 'medium';

        const isAr = this.settings.language === 'ar';

        const content = document.getElementById('taskDetailsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">${this.t('form.taskTitle')}</span>
                <span class="detail-value">${escapeHTML(task.title)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${this.t('form.description')}</span>
                <span class="detail-value">${escapeHTML(task.description || '—')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${this.t('form.category')}</span>
                <span class="detail-value">${this.getCategoryLabel(task.category)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${this.t('form.priority')}</span>
                <span class="detail-value">${this.getPriorityLabel(task.priority)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${isAr ? 'الحالة' : 'Status'}</span>
                <span class="detail-value">${this.t('status.' + task.status.replace('-', ''))}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${this.t('form.estimatedTime')}</span>
                <span class="detail-value">${task.estimatedTime} ${this.t('settings.minutes')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">${isAr ? 'الوقت الفعلي' : 'Actual Time'}</span>
                <span class="detail-value">${task.actualTime} ${this.t('settings.minutes')}</span>
            </div>
            ${task.dueDate ? `
            <div class="detail-row">
                <span class="detail-label">${this.t('form.dueDate')}</span>
                <span class="detail-value">${new Date(task.dueDate).toLocaleString(isAr ? 'ar-SA' : 'en-US')}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">${this.t('form.repeat')}</span>
                <span class="detail-value">${this.t('repeat.' + task.repeat)}</span>
            </div>
            ${task.tags.length > 0 ? `
            <div class="detail-row">
                <span class="detail-label">${this.t('form.tags')}</span>
                <span class="detail-value">${escapeHTML(task.tags.join(', '))}</span>
            </div>
            ` : ''}
            <div class="detail-actions">
                ${task.status !== 'completed' ? `
                    <button class="btn-primary" onclick="app.startTask('${safeId}'); app.closeTaskDetails();">
                        <i class="fas fa-play"></i> ${this.t('timer.start')}
                    </button>
                    <button class="btn-primary" onclick="app.completeTask('${safeId}'); app.closeTaskDetails();">
                        <i class="fas fa-check"></i> ${this.t('status.completed')}
                    </button>
                ` : ''}
                <button class="btn-secondary" onclick="app.editTask('${safeId}'); app.closeTaskDetails();">
                    <i class="fas fa-edit"></i> ${isAr ? 'تعديل' : 'Edit'}
                </button>
                <button class="btn-danger" onclick="app.deleteTask('${safeId}'); app.closeTaskDetails();">
                    <i class="fas fa-trash"></i> ${isAr ? 'حذف' : 'Delete'}
                </button>
            </div>
        `;

        const tdm = document.getElementById('taskDetailsModal');
        const tdo = document.getElementById('taskDetailsOverlay');
        if (tdm) tdm.classList.add('active');
        if (tdo) tdo.classList.add('active');
    },

    closeTaskDetails() {
        const tdm = document.getElementById('taskDetailsModal');
        const tdo = document.getElementById('taskDetailsOverlay');
        if (tdm) tdm.classList.remove('active');
        if (tdo) tdo.classList.remove('active');
    },

    renderCalendar() {
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        const isAr = this.settings.language === 'ar';

        const monthNames = isAr 
            ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
            : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const cmy = document.getElementById('calendarMonthYear');
        if (cmy) cmy.textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const container = document.getElementById('calendarDays');
        if (!container) return;
        container.innerHTML = '';

        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const div = document.createElement('div');
            div.className = 'cal-day other-month';
            div.textContent = day;
            container.appendChild(div);
        }

        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toDateString();
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();

            const dayTasks = this.tasks.filter(t => {
                if (t.dueDate) {
                    return new Date(t.dueDate).toDateString() === dateStr;
                }
                return false;
            });

            const div = document.createElement('div');
            div.className = 'cal-day';
            if (isToday) div.classList.add('today');
            if (isSelected) div.classList.add('selected');
            if (dayTasks.length > 0) div.classList.add('has-tasks');

            div.innerHTML = day + (dayTasks.length > 0 ? `<span class="task-count">${dayTasks.length}</span>` : '');
            div.onclick = () => this.selectCalendarDate(date);

            container.appendChild(div);
        }

        const remaining = (7 - ((firstDay + daysInMonth) % 7)) % 7;
        for (let day = 1; day <= remaining; day++) {
            const div = document.createElement('div');
            div.className = 'cal-day other-month';
            div.textContent = day;
            container.appendChild(div);
        }

        this.renderCalendarTasks();
    },

    selectCalendarDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
    },

    renderCalendarTasks() {
        const escapeHTML = window.NuvioSecurity.escapeHTML;
        const list = document.getElementById('calTasksList');
        if (!list) return;

        const dateStr = this.selectedDate ? this.selectedDate.toDateString() : new Date().toDateString();

        const dayTasks = this.tasks.filter(t => {
            if (t.dueDate) return new Date(t.dueDate).toDateString() === dateStr;
            return false;
        });

        if (dayTasks.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">' + (this.settings.language === 'ar' ? 'لا توجد مهام لهذا اليوم' : 'No tasks for this day') + '</p>';
            return;
        }

        list.innerHTML = dayTasks.map(task => `
            <div class="cal-task-item">
                <span class="task-dot" style="background: ${(this.categories[task.category] || this.categories.personal).color};"></span>
                <span class="task-title">${escapeHTML(task.title)}</span>
                <span class="task-time">${task.dueDate ? new Date(task.dueDate).toLocaleTimeString(this.settings.language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
        `).join('');
    },

    prevMonth() {
        this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
        this.renderCalendar();
    },

    nextMonth() {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
        this.renderCalendar();
    },
});
