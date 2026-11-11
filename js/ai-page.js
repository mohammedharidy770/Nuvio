(function () {
    'use strict';

    const API_URL = 'https://nuvio-blue.vercel.app/api/chat';
    const HISTORY_KEY = 'nuvio_ai_history';
    const TASKS_KEY = 'nuvio_tasks';
    let conversations = [];
    let activeId = null;
    let sending = false;
    const SETTINGS_KEY = 'nuvio_ai_settings';

    const dom = {
        section: null,
        messages: null,
        history: null,
        input: null,
        send: null,
        title: null,
        newChat: null,
        clear: null,
        mobileMenu: null,
        sidebar: null,
        settingsPanel: null,
        settingsBackdrop: null
    };

    function loadHistory() {
        try {
            const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            conversations = Array.isArray(value) ? value : [];
        } catch (error) {
            conversations = [];
            console.error('Could not load AI history:', error);
        }
    }

    function saveHistory() {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations.slice(0, 30)));
    }

    function currentChat() {
        return conversations.find(chat => chat.id === activeId) || null;
    }

    function createChat() {
        const chat = {
            id: 'chat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            title: 'محادثة جديدة',
            messages: [],
            updatedAt: Date.now()
        };
        conversations.unshift(chat);
        activeId = chat.id;
        saveHistory();
        render();
        dom.input?.focus();
    }

    function escapeText(value) {
        return String(value ?? '');
    }

    function renderHistory() {
        if (!dom.history) return;
        dom.history.replaceChildren();
        conversations.forEach(chat => {
            const row = document.createElement('div');
            row.className = 'ai-history-row' + (chat.id === activeId ? ' active' : '');
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ai-history-item' + (chat.id === activeId ? ' active' : '');
            button.textContent = chat.title;
            button.addEventListener('click', () => {
                activeId = chat.id;
                dom.sidebar?.classList.remove('open');
                render();
            });
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'ai-history-delete';
            remove.title = 'حذف المحادثة';
            remove.setAttribute('aria-label', 'حذف المحادثة');
            remove.innerHTML = '<i class="fas fa-trash-can"></i>';
            remove.addEventListener('click', () => deleteConversation(chat.id));
            row.append(button, remove);
            dom.history.appendChild(row);
        });
    }

    function deleteConversation(id) {
        const index = conversations.findIndex(chat => chat.id === id);
        if (index === -1 || !window.confirm('هل تريد حذف هذه المحادثة نهائيًا؟')) return;
        conversations.splice(index, 1);
        saveHistory();
        if (activeId === id) {
            activeId = conversations[0]?.id || null;
        }
        if (!conversations.length) createChat();
        else render();
    }

    function appendMessage(role, text) {
        const message = document.createElement('div');
        message.className = `ai-message ai-message-${role}`;
        message.textContent = escapeText(text);
        if (role === 'assistant') {
            addCopyButton(message);
        }
        dom.messages.appendChild(message);
        scrollToLatest();
        return message;
    }

    function addCopyButton(message) {
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'ai-copy-message';
        copy.innerHTML = '<i class="fas fa-copy"></i>';
        copy.title = 'نسخ الرد';
        copy.setAttribute('aria-label', 'نسخ الرد');
        copy.addEventListener('click', async () => {
            const reply = [...message.childNodes]
                .filter(node => node !== copy)
                .map(node => node.textContent || '')
                .join('');
            await navigator.clipboard.writeText(reply.trim());
            copy.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { copy.innerHTML = '<i class="fas fa-copy"></i>'; }, 1200);
        });
        message.appendChild(copy);
    }

    function scrollToLatest() {
        requestAnimationFrame(() => {
            if (!dom.messages) return;
            dom.messages.scrollTo({ top: dom.messages.scrollHeight, behavior: 'smooth' });
        });
    }

    function render() {
        const chat = currentChat();
        if (!chat) {
            createChat();
            return;
        }
        if (dom.title) dom.title.textContent = chat.title;
        dom.messages.replaceChildren();
        if (!chat.messages.length) renderWelcome();
        else chat.messages.forEach(item => appendMessage(item.role === 'user' ? 'user' : 'assistant', item.content));
        scrollToLatest();
        renderHistory();
    }

    function renderWelcome() {
        const welcome = document.createElement('div');
        welcome.className = 'ai-welcome';
        welcome.innerHTML = `
            <div class="ai-welcome-mark" aria-hidden="true">N</div>
            <h1>كيف يمكنني مساعدتك؟</h1>
            <p>خطط ليومك، نظّم مهامك، أو اسأل عن أي شيء في Nuvio.</p>
            <div class="ai-suggestions">
                <button data-prompt="جهز لي خطة يومية مرتبة حسب وقتي ومهامي"><i class="fas fa-calendar-day"></i><span>خطط يومي</span><small>رتّب مهام اليوم حسب الأولوية</small></button>
                <button data-prompt="حلل مهامي واقترح أفضل طريقة لإنجازها"><i class="fas fa-list-check"></i><span>حلل مهامي</span><small>اعرض ترتيبًا واقعيًا للإنجاز</small></button>
                <button data-prompt="اقترح جلسة تركيز لمدة 25 دقيقة"><i class="fas fa-clock"></i><span>ابدأ تركيز</span><small>اقترح مهمة وجدول جلسة قصيرة</small></button>
                <button data-prompt="اشرح لي أفضل طريقة لبناء عادة يومية مستمرة"><i class="fas fa-seedling"></i><span>ابنِ عادة</span><small>قدّم خطة بسيطة قابلة للاستمرار</small></button>
            </div>`;
        welcome.querySelectorAll('[data-prompt]').forEach(button => {
            button.addEventListener('click', () => {
                dom.input.value = button.dataset.prompt;
                dom.input.dispatchEvent(new Event('input'));
                dom.input.focus();
            });
        });
        dom.messages.appendChild(welcome);
    }

    function getAISettings() {
        try {
            return { tone: 'concise', actionsEnabled: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
        } catch {
            return { tone: 'concise', actionsEnabled: true };
        }
    }

    function saveAISettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    function openSettings(open) {
        dom.settingsPanel?.classList.toggle('open', open);
        dom.settingsBackdrop?.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    }

    function syncSettings() {
        const settings = getAISettings();
        const tone = document.getElementById('aiResponseTone');
        const actions = document.getElementById('aiAutoActions');
        if (tone) tone.value = settings.tone;
        if (actions) actions.checked = settings.actionsEnabled;
    }

    function showTyping() {
        const typing = document.createElement('div');
        typing.className = 'ai-message ai-message-assistant ai-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        dom.messages.appendChild(typing);
        scrollToLatest();
        return typing;
    }

    async function animateReply(text) {
        const message = appendMessage('assistant', '');
        const copy = message.querySelector('.ai-copy-message');
        copy?.remove();
        const chunks = Array.from(escapeText(text));
        for (let index = 0; index < chunks.length; index++) {
            message.textContent += chunks[index];
            if (index % 3 === 0) scrollToLatest();
            await new Promise(resolve => setTimeout(resolve, chunks[index] === '\n' ? 5 : 7));
        }
        addCopyButton(message);
    }

    function parseJSON(value) {
        try {
            return JSON.parse(value);
        } catch {
            const match = String(value).match(/\{[\s\S]*\}/);
            try {
                return JSON.parse(match?.[0] || '{}');
            } catch {
                return { reply: String(value), actions: [] };
            }
        }
    }

    function inferDirectActions(message) {
        const text = String(message).toLowerCase();
        const actions = [];
        const sections = {
            dashboard: /لوحة التحكم|الرئيسية/,
            tasks: /المهام|مهامي/,
            focus: /التركيز/,
            calendar: /التقويم/,
            reports: /التقارير/,
            habits: /العادات/,
            prayer: /الصلاة/,
            sleep: /النوم/,
            water: /الماء/,
            notes: /الملاحظات/,
            settings: /الإعدادات/,
            ai: /الذكاء الاصطناعي|AI Nuvio/
        };
        if (/افتح|روح\s+ل?ي?\s*الى|اذهب|فتح/.test(text)) {
            Object.entries(sections).forEach(([section, pattern]) => {
                if (pattern.test(text)) actions.push({ type: 'navigate', section });
            });
        }
        if (/الوضع الداكن|الوضع الليلي/.test(text)) actions.push({ type: 'set_theme', dark: true });
        if (/الوضع الفاتح/.test(text)) actions.push({ type: 'set_theme', dark: false });
        if (/كوب (ماء|مياه)|اشرب|كاس مويه|زود الميه|أضف.*ماء/.test(text)) actions.push({ type: 'add_water_glass' });
        if (/ابدأ.*تركيز|شغل.*تركيز|ابدأ.*بومودورو/.test(text)) actions.push({ type: 'start_focus' });
        if (/امسح.*إشعارات|امسح.*اشعارات|مسح الإشعارات/.test(text)) actions.push({ type: 'clear_notifications' });
        return actions;
    }

    function getTasks() {
        if (window.app?.tasks) return window.app.tasks;
        try {
            const stored = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
            return Array.isArray(stored) ? stored : [];
        } catch {
            return [];
        }
    }

    function localDateKey(value) {
        if (!value) return '';
        const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value));
        if (match) return match[1];
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
    }

    function localDateTimeForOffset(days = 0) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        date.setHours(12, 0, 0, 0);
        return date.toISOString();
    }

    function inferRelativeTaskDateActions(message) {
        const text = String(message || '').toLowerCase();
        const asks = /(خلي|خلّي|غير|غيّر|يغير|يغيّر|عدل|عدّل|انقل|اجعل|حوّل|حول|ميعاد|المعاد|موعد|التاريخ|التوقيت)/.test(text);
        const offset = /(النهارده|النهاردة|اليوم|النهار)/.test(text) ? 0 : /(بكره|بكرة|غدا|غداً)/.test(text) ? 1 : null;
        if (!asks || offset === null) return [];
        const tasks = getTasks();
        const norm = value => String(value || '').toLowerCase()
            .replace(/[ًٌٍَُِّْـ]/g, '')
            .replace(/[أإآ]/g, 'ا').replace(/[ىي]/g, 'ي')
            .replace(/[^\u0600-\u06FF\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const msg = norm(text);
        const named = tasks.filter(task => {
            const title = norm(task.title);
            return title.length >= 3 && msg.includes(title);
        });
        let targets = [];
        if (named.length === 1) targets = named;
        else if (named.length > 1) return [];
        else {
            const asksAll = /(كل المهام|جميع المهام|كل المهمات|جميع المهمات|المهام كلها|كل التاسكات)/.test(msg);
            if (asksAll) targets = tasks.filter(task => task.status !== 'completed');
            else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowKey = localDateKey(tomorrow);
                targets = tasks.filter(task => task.status !== 'completed' && localDateKey(task.dueDate) === tomorrowKey);
            }
        }
        return targets.map(task => ({
            type: 'update_task',
            task: task.id,
            changes: { dueDate: localDateTimeForOffset(offset) }
        }));
    }

    function getAppContext() {
        const tasks = getTasks();
        return {
            currentDate: new Date().toISOString(),
            localDate: (() => { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); })(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            currentSection: window.app?.currentSection || '',
            theme: window.app?.settings?.darkMode ? 'dark' : 'light',
            language: window.app?.settings?.language || 'ar',
            tasks: tasks.slice(0, 80).map(task => ({
                id: task.id,
                title: task.title,
                status: task.status,
                category: task.category,
                priority: task.priority,
                dueDate: task.dueDate,
                estimatedTime: task.estimatedTime
            })),
            habits: Array.isArray(window.app?.habits) ? window.app.habits.slice(0, 30).map(habit => ({
                id: habit.id, title: habit.title, target: habit.target, unit: habit.unit,
                repeatDays: habit.repeatDays
            })) : [],
            notes: Array.isArray(window.app?.notes) ? window.app.notes.slice(0, 40).map(note => ({
                id: note.id, title: note.title, tags: note.tags, updatedAt: note.updatedAt
            })) : [],
            water: window.app?.waterData ? {
                today: window.app.waterData.today, goal: window.app.waterData.goal
            } : null,
            focus: window.app?.timerState ? {
                running: window.app.timerState.running, paused: window.app.timerState.paused,
                mode: window.app.timerState.mode, timeLeft: window.app.timerState.timeLeft
            } : null,
            counts: {
                tasks: tasks.length,
                habits: window.app?.habits?.length || 0,
                notes: window.app?.notes?.length || 0
            }
        };
    }

    function findTask(reference) {
        const value = String(typeof reference === 'object'
            ? reference?.title || reference?.id || ''
            : reference || '').trim().toLowerCase();
        if (!value) return null;
        const exact = getTasks().filter(task =>
            task.id === value || task.title?.toLowerCase?.() === value
        );
        if (exact.length === 1) return exact[0];
        if (exact.length > 1) return null;
        const partial = getTasks().filter(task => task.title?.toLowerCase?.().includes(value));
        return partial.length === 1 ? partial[0] : null;
    }

    function findNote(reference) {
        const value = String(typeof reference === 'object'
            ? reference?.title || reference?.id || ''
            : reference || '').trim().toLowerCase();
        if (!value || !Array.isArray(window.app?.notes)) return null;
        const exact = window.app.notes.filter(note =>
            note.id === value || note.title?.toLowerCase?.() === value
        );
        if (exact.length === 1) return exact[0];
        if (exact.length > 1) return null;
        const partial = window.app.notes.filter(note => note.title?.toLowerCase?.().includes(value));
        return partial.length === 1 ? partial[0] : null;
    }

    function executeActions(actions) {
        if (!window.app || !Array.isArray(actions)) return 0;
        let count = 0;
        let changedTasks = false;

        actions.forEach(action => {
            if (!action?.type) return;

            if (['delete_task', 'delete_note', 'delete_habit'].includes(action.type)) {
                const label = action.type === 'delete_task' ? 'المهمة'
                    : action.type === 'delete_note' ? 'الملاحظة' : 'العادة';
                if (!window.confirm(`هل تريد حذف ${label} المحددة؟`)) return;
            }

            if (action.type === 'navigate') {
                const sections = ['dashboard', 'tasks', 'focus', 'calendar', 'reports', 'habits', 'prayer', 'sleep', 'water', 'notes', 'settings', 'ai'];
                if (sections.includes(action.section)) {
                    window.app.showSection(action.section);
                    count++;
                }
                return;
            }

            if (action.type === 'set_theme') {
                const dark = action.dark !== false;
                if (window.app.settings.darkMode !== dark) window.app.toggleTheme();
                count++;
                return;
            }

            if (action.type === 'add_habit') {
                const input = action.habit || {};
                if (!input.title) return;
                window.app.habits.unshift({
                    id: 'habit-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                    title: String(input.title).trim().slice(0, 150),
                    description: String(input.description || '').trim().slice(0, 1000),
                    icon: /^[a-z0-9-]{1,40}$/i.test(String(input.icon || '')) ? String(input.icon) : 'fa-bullseye',
                    color: /^#[0-9a-f]{6}$/i.test(String(input.color || '')) ? String(input.color) : '#dc2626',
                    target: Math.max(1, parseInt(input.target, 10) || 1),
                    unit: String(input.unit || 'مرة').trim().slice(0, 30),
                    reminderTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(input.reminderTime || '')) ? input.reminderTime : null,
                    repeatDays: Array.isArray(input.repeatDays) ? input.repeatDays.filter(day => Number.isInteger(day) && day >= 0 && day <= 6) : [0, 1, 2, 3, 4, 5, 6],
                    logs: {},
                    createdAt: new Date().toISOString()
                });
                window.app.saveHabits();
                window.app.renderHabits();
                count++;
                return;
            }

            if (action.type === 'complete_habit' || action.type === 'toggle_habit') {
                const value = String(action.habit || '').trim().toLowerCase();
                const matches = window.app.habits.filter(item =>
                    item.id === action.habit || item.title?.toLowerCase() === value
                );
                const partial = matches.length ? matches : window.app.habits.filter(item =>
                    item.title?.toLowerCase().includes(value)
                );
                const habit = partial.length === 1 ? partial[0] : null;
                if (habit) {
                    window.app.toggleHabitToday(habit.id);
                    count++;
                }
                return;
            }

            if (action.type === 'delete_habit') {
                const value = String(action.habit || '').trim().toLowerCase();
                const matches = window.app.habits.filter(habit =>
                    habit.id === action.habit || habit.title?.toLowerCase() === value
                );
                const partial = matches.length ? matches : window.app.habits.filter(habit =>
                    habit.title?.toLowerCase().includes(value)
                );
                if (partial.length !== 1) return;
                window.app.habits = window.app.habits.filter(habit => habit.id !== partial[0].id);
                window.app.saveHabits();
                window.app.renderHabits();
                count++;
                return;
            }

            if (action.type === 'add_water_glass') {
                if (typeof window.app.addWaterGlass === 'function') {
                    window.app.addWaterGlass();
                    count++;
                }
                return;
            }

            if (action.type === 'set_water_goal') {
                const goal = Number(action.goal);
                if (Number.isInteger(goal) && goal > 0 && goal <= 30 && window.app.waterData) {
                    window.app.updateWaterGoal(goal);
                    count++;
                }
                return;
            }

            if (action.type === 'add_note') {
                const input = action.note || {};
                const title = String(input.title || '').trim().slice(0, 150);
                if (!title || !Array.isArray(window.app.notes)) return;
                const content = String(input.content || '').trim().slice(0, 10000);
                const duplicate = window.app.notes.some(note =>
                    note.title.toLowerCase() === title.toLowerCase() && note.content === content
                );
                if (duplicate) return;
                window.app.notes.unshift({
                    id: 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                    title, content,
                    tags: Array.isArray(input.tags) ? input.tags.slice(0, 10).map(tag => String(tag).slice(0, 40)) : [],
                    color: /^#[0-9a-f]{6}$/i.test(input.color || '') ? input.color : '#fef3c7',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                window.app.saveNotes();
                window.app.renderNotes();
                count++;
                return;
            }

            if (action.type === 'update_note') {
                const note = findNote(action.note);
                if (!note) return;
                const changes = action.changes || {};
                if (typeof changes.title === 'string' && changes.title.trim()) note.title = changes.title.trim().slice(0, 150);
                if (typeof changes.content === 'string') note.content = changes.content.slice(0, 10000);
                if (Array.isArray(changes.tags)) note.tags = changes.tags.slice(0, 10).map(tag => String(tag).slice(0, 40));
                note.updatedAt = new Date().toISOString();
                window.app.saveNotes();
                window.app.renderNotes();
                count++;
                return;
            }

            if (action.type === 'delete_note') {
                const note = findNote(action.note);
                if (!note) return;
                window.app.notes = window.app.notes.filter(item => item.id !== note.id);
                window.app.saveNotes();
                window.app.renderNotes();
                count++;
                return;
            }

            if (action.type === 'start_focus') {
                window.app.startTimer();
                count++;
                return;
            }

            if (action.type === 'clear_notifications') {
                window.app.clearNotifications();
                count++;
                return;
            }

            if (action.type === 'add_task') {
                const input = action.task || {};
                if (!input.title) return;
                const due = input.dueDate && !Number.isNaN(Date.parse(input.dueDate))
                    ? new Date(input.dueDate).toISOString()
                    : null;
                const duplicate = due && window.app.tasks.some(task =>
                    task.title === String(input.title).trim() && task.dueDate === due
                );
                if (duplicate) return;

                window.app.tasks.unshift({
                    id: 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                    title: String(input.title).trim().slice(0, 150),
                    description: String(input.description || '').trim().slice(0, 1000),
                    category: input.category || 'study',
                    priority: input.priority || 'medium',
                    status: 'pending',
                    dueDate: due,
                    endDate: input.endDate && !Number.isNaN(Date.parse(input.endDate))
                        ? new Date(input.endDate).toISOString()
                        : null,
                    estimatedTime: Math.min(1440, Math.max(1, parseInt(input.estimatedTime, 10) || 25)),
                    actualTime: 0,
                    repeat: 'none',
                    reminder: 0,
                    tags: Array.isArray(input.tags) ? input.tags.slice(0, 10) : [],
                    createdAt: new Date().toISOString(),
                    completedAt: null
                });
                count++;
                changedTasks = true;
                return;
            }

            const task = findTask(action.task);
            if (!task) return;

            if (action.type === 'delete_task') {
                window.app.tasks = window.app.tasks.filter(item => item.id !== task.id);
                count++;
                changedTasks = true;
            } else if (action.type === 'complete_task') {
                task.status = task.status === 'completed' ? 'pending' : 'completed';
                task.completedAt = task.status === 'completed' ? new Date().toISOString() : null;
                count++;
                changedTasks = true;
            } else if (action.type === 'start_task') {
                window.app.tasks.forEach(item => {
                    if (item.status === 'in-progress') item.status = 'pending';
                });
                task.status = 'in-progress';
                count++;
                changedTasks = true;
            } else if (action.type === 'update_task') {
                const changes = action.changes || {};
                if (changes.title) task.title = String(changes.title).trim().slice(0, 150);
                if (changes.description !== undefined) task.description = String(changes.description).trim().slice(0, 1000);
                if (changes.category) task.category = changes.category;
                if (changes.priority) task.priority = changes.priority;
                if (changes.estimatedTime) task.estimatedTime = Math.min(1440, Math.max(1, parseInt(changes.estimatedTime, 10)));
                if (Object.prototype.hasOwnProperty.call(changes, 'dueDate')) {
                    const nextDate = changes.dueDate === null ? null : new Date(changes.dueDate);
                    if (changes.dueDate === null || !Number.isNaN(nextDate.getTime())) task.dueDate = nextDate ? nextDate.toISOString() : null;
                    else return;
                }
                const hasOtherChange = Boolean(changes.title || changes.description !== undefined || changes.category || changes.priority || changes.estimatedTime);
                if (hasOtherChange || Object.prototype.hasOwnProperty.call(changes, 'dueDate')) { count++; changedTasks = true; }
            }
        });

        if (changedTasks) {
            window.app.saveData();
            window.app.renderAll();
        }
        return count;
    }

    function parseSchedule(message) {
        const actions = [];
        String(message).split(/\n+/).forEach(line => {
            const range = /(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/.exec(line);
            if (!range) return;
            const start = timeToDate(range[1]);
            const end = timeToDate(range[2], start || undefined);
            if (!start || !end || end <= start) return;
            const title = line
                .replace(range[0], '')
                .replace(/^[^\w\u0600-\u06FF]+/, '')
                .replace(/^[|:\s]+/, '')
                .replace(/^[🧪🧬📚🕌☕🍽️🌙]+\s*/, '')
                .trim();
            if (!title) return;

            actions.push({
                type: 'add_task',
                task: {
                    title,
                    description: `من ${range[1]} إلى ${range[2]}`,
                    category: /كيمياء|أحياء|عربي/.test(title) ? 'study' : /صلاة|شرعي/.test(title) ? 'Islam' : 'personal',
                    priority: /كيمياء|أحياء|عربي/.test(title) ? 'high' : 'medium',
                    dueDate: start.toISOString(),
                    endDate: end.toISOString(),
                    estimatedTime: Math.round((end - start) / 60000),
                    tags: ['جدول اليوم']
                }
            });
        });
        return actions;
    }

    async function sendMessage() {
        if (sending || !dom.input) return;
        const text = dom.input.value.trim();
        const chat = currentChat();
        if (!text || !chat) return;
        const settings = getAISettings();

        sending = true;
        dom.input.value = '';
        dom.input.style.height = '';
        dom.send.disabled = true;
        chat.messages.push({ role: 'user', content: text });
        chat.title = text.slice(0, 36);
        chat.updatedAt = Date.now();
        appendMessage('user', text);
        saveHistory();
        renderHistory();


        const typing = showTyping();
        try {
            const session = await window.NuvioCloud?.getSession();
            if (!session?.access_token) throw new Error('سجّل الدخول لاستخدام Nuvio AI.');

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + session.access_token
                },
                body: JSON.stringify({
                    message: text,
                    context: getAppContext(),
                    history: chat.messages.slice(-11, -1),
                    preferences: settings
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'تعذر الاتصال بالمساعد');
            typing.remove();

            const result = parseJSON(data.reply);
            const relativeDateActions = inferRelativeTaskDateActions(text);
            if (relativeDateActions.length) {
                result.actions = relativeDateActions;
                result.reply = relativeDateActions.length === 1
                    ? 'تم تحديث موعد المهمة إلى التاريخ المطلوب.'
                    : `تم تحديث مواعيد ${relativeDateActions.length} مهمة نشطة إلى التاريخ المطلوب.`;
            }
            if (!Array.isArray(result.actions) || !result.actions.length) {
                const direct = inferDirectActions(text);
                if (direct.length) {
                    result.actions = direct;
                    if (!result.reply || /لم أفهم|لا أفهم|اعتذر/i.test(result.reply)) {
                        result.reply = direct.length === 1 ? 'تم تنفيذ الأمر.' : `تم تنفيذ ${direct.length} إجراءات.`;
                    }
                }
            }
            const actions = settings.actionsEnabled ? result.actions : [];
            const count = executeActions(actions);
            const requestedTaskUpdate = actions.some(action => action?.type === 'update_task');
            const reply = count
                ? `${result.reply || 'تم تنفيذ الطلب.'}\nتم حفظ ${count} تعديل داخل الموقع.`
                : requestedTaskUpdate
                    ? 'لم يتم تعديل أي مهمة. لم أجد مهامًا مطابقة أو تعذر حفظ التواريخ. راجع المهام وحاول مرة أخرى.'
                    : result.reply || escapeText(data.reply);
            await animateReply(reply);
            chat.messages.push({ role: 'assistant', content: reply });
            saveHistory();
        } catch (error) {
            typing.remove();
            const reply = error.message || 'تعذر الاتصال بالمساعد، حاول مرة أخرى.';
            await animateReply(reply);
            chat.messages.push({ role: 'assistant', content: reply });
            saveHistory();
        } finally {
            sending = false;
            dom.send.disabled = false;
            dom.input.focus();
        }
    }

    function initialize() {
        dom.section = document.getElementById('aiSection');
        dom.messages = document.getElementById('messages');
        dom.history = document.getElementById('historyList');
        dom.input = document.getElementById('prompt');
        dom.send = document.getElementById('sendPrompt');
        dom.title = document.getElementById('chatTitle');
        dom.newChat = document.getElementById('newChat');
        dom.clear = document.getElementById('clearChat');
        dom.mobileMenu = document.getElementById('mobileMenu');
        dom.sidebar = document.getElementById('aiSidebar');
        dom.settingsPanel = document.getElementById('aiSettingsPanel');
        dom.settingsBackdrop = document.getElementById('aiSettingsBackdrop');

        if (!dom.section || !dom.messages || !dom.input || !dom.send) return;

        loadHistory();
        dom.newChat?.addEventListener('click', createChat);
        dom.clear?.addEventListener('click', () => {
            const chat = currentChat();
            if (!chat || !window.confirm('هل تريد مسح هذه المحادثة؟')) return;
            conversations = conversations.filter(item => item.id !== chat.id);
            saveHistory();
            activeId = null;
            if (conversations.length) {
                activeId = conversations[0].id;
                render();
            } else {
                createChat();
            }
        });
        dom.mobileMenu?.addEventListener('click', () => {
            const isOpen = dom.sidebar?.classList.toggle('open') || false;
            dom.mobileMenu?.setAttribute('aria-expanded', String(isOpen));
        });
        document.addEventListener('click', event => {
            if (window.innerWidth > 768 || !dom.sidebar?.classList.contains('open')) return;
            if (!dom.sidebar.contains(event.target) && !dom.mobileMenu?.contains(event.target)) {
                dom.sidebar.classList.remove('open');
                dom.mobileMenu?.setAttribute('aria-expanded', 'false');
            }
        });
        document.getElementById('openAISettings')?.addEventListener('click', () => {
            syncSettings();
            openSettings(true);
        });
        document.getElementById('closeAISettings')?.addEventListener('click', () => openSettings(false));
        dom.settingsBackdrop?.addEventListener('click', () => openSettings(false));
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                openSettings(false);
                dom.sidebar?.classList.remove('open');
            }
        });
        document.getElementById('aiResponseTone')?.addEventListener('change', event => {
            saveAISettings({ ...getAISettings(), tone: event.target.value });
        });
        document.getElementById('aiAutoActions')?.addEventListener('change', event => {
            saveAISettings({ ...getAISettings(), actionsEnabled: event.target.checked });
        });
        document.getElementById('resetAISettings')?.addEventListener('click', () => {
            saveAISettings({ tone: 'concise', actionsEnabled: true });
            syncSettings();
        });
        dom.send.addEventListener('click', sendMessage);
        dom.input.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
        dom.input.addEventListener('input', () => {
            dom.input.style.height = 'auto';
            dom.input.style.height = Math.min(dom.input.scrollHeight, 150) + 'px';
        });

        if (!conversations.length) createChat();
        else {
            activeId = conversations[0].id;
            render();
        }
    }

    initialize();
})();
