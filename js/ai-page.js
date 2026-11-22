(function () {
    'use strict';

    const API_URL = window.location.hostname.endsWith('.vercel.app')
        ? window.location.origin + '/api/chat'
        : 'https://nuvio-blue.vercel.app/api/chat';
    const HISTORY_KEY = 'nuvio_ai_history';
    const TASKS_KEY = 'nuvio_tasks';
    let conversations = [];
    let activeId = null;
    let sending = false;
    const SETTINGS_KEY = 'nuvio_ai_settings';
    const aiT = key => window.app?.t?.('ai.' + key) || key;

    const dom = {
        section: null,
        messages: null,
        history: null,
        input: null,
        send: null,
        title: null,
        newChat: null,
        clear: null,
        back: null,
        mobileMenu: null,
        sidebar: null,
        settingsPanel: null,
        settingsBackdrop: null
    };

    function loadHistory() {
        try {
            const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            conversations = Array.isArray(value)
                ? value.filter(chat =>
                    chat && typeof chat === 'object'
                    && typeof chat.id === 'string'
                    && Array.isArray(chat.messages)
                ).map(chat => {
                    const title = typeof chat.title === 'string' ? chat.title.trim() : '';
                    return {
                        id: chat.id,
                        title: !title || ['محادثة جديدة', 'New conversation', 'newConversation'].includes(title)
                            ? aiT('newConversation')
                            : title.slice(0, 48),
                        messages: chat.messages.filter(item =>
                            item && typeof item === 'object'
                            && ['user', 'assistant'].includes(item.role)
                            && typeof item.content === 'string'
                        ).slice(-100),
                        updatedAt: Number(chat.updatedAt) || Date.now()
                    };
                }).slice(0, 30)
                : [];
        } catch (error) {
            conversations = [];
            console.error('Could not load AI history:', error);
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations.slice(0, 30)));
            window.NuvioSync?.scheduleSave();
        } catch (error) {
            console.error('Could not save AI history:', error);
            window.app?.showToast?.(
                window.app.settings.language === 'ar'
                    ? 'تعذر حفظ المحادثة على الجهاز.'
                    : 'Could not save the conversation on this device.',
                'error'
            );
        }
    }

    function currentChat() {
        return conversations.find(chat => chat.id === activeId) || null;
    }

    function createChat() {
        const chat = {
            id: 'chat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            title: aiT('newConversation'),
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

    function askForConfirmation(message) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'ai-confirm-backdrop';
            overlay.setAttribute('role', 'presentation');
            overlay.innerHTML = `
                <div class="ai-confirm" role="dialog" aria-modal="true" aria-label="${aiT('confirmTitle')}">
                    <div class="ai-confirm-icon"><i class="fas fa-triangle-exclamation"></i></div>
                    <p></p>
                    <div class="ai-confirm-actions">
                        <button type="button" class="ai-confirm-cancel">${aiT('cancel')}</button>
                        <button type="button" class="ai-confirm-delete">${aiT('delete')}</button>
                    </div>
                </div>`;
            overlay.querySelector('p').textContent = message;
            const finish = result => {
                overlay.remove();
                resolve(result);
            };
            overlay.querySelector('.ai-confirm-cancel').addEventListener('click', () => finish(false));
            overlay.querySelector('.ai-confirm-delete').addEventListener('click', () => finish(true));
            overlay.addEventListener('click', event => {
                if (event.target === overlay) finish(false);
            });
            overlay.addEventListener('keydown', event => {
                if (event.key === 'Escape') finish(false);
                if (event.key === 'Enter') finish(true);
            });
            document.body.appendChild(overlay);
            overlay.querySelector('.ai-confirm-cancel').focus();
        });
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
            remove.title = aiT('delete');
            remove.setAttribute('aria-label', aiT('delete'));
            remove.innerHTML = '<i class="fas fa-trash-can"></i>';
            remove.addEventListener('click', () => deleteConversation(chat.id));
            row.append(button, remove);
            dom.history.appendChild(row);
        });
    }

    async function deleteConversation(id) {
        const index = conversations.findIndex(chat => chat.id === id);
        if (index === -1) return;
        if (!await askForConfirmation(aiT('deleteConversation'))) return;
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
        const content = document.createElement('span');
        content.className = 'ai-message-text';
        content.textContent = escapeText(text);
        message.appendChild(content);
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
        copy.title = aiT('copyResponse');
        copy.setAttribute('aria-label', aiT('copyResponse'));
        copy.addEventListener('click', async () => {
            const reply = message.querySelector('.ai-message-text')?.textContent || '';
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(reply.trim());
                } else {
                    const textarea = document.createElement('textarea');
                    textarea.value = reply.trim();
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    textarea.remove();
                }
                copy.innerHTML = '<i class="fas fa-check"></i>';
            } catch (error) {
                window.app?.showToast?.(
                    aiT('copyFailed'),
                    'error'
                );
            }
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
            <h1>${aiT('welcomeTitle')}</h1>
            <p>${aiT('welcomeDescription')}</p>
            <div class="ai-suggestions">
                <button data-prompt-key="plan"><i class="fas fa-calendar-day"></i><span>${aiT('suggestionPlan')}</span><small>${aiT('suggestionPlanHelp')}</small></button>
                <button data-prompt-key="analyze"><i class="fas fa-list-check"></i><span>${aiT('suggestionAnalyze')}</span><small>${aiT('suggestionAnalyzeHelp')}</small></button>
                <button data-prompt-key="focus"><i class="fas fa-clock"></i><span>${aiT('suggestionFocus')}</span><small>${aiT('suggestionFocusHelp')}</small></button>
                <button data-prompt-key="habit"><i class="fas fa-seedling"></i><span>${aiT('suggestionHabit')}</span><small>${aiT('suggestionHabitHelp')}</small></button>
            </div>`;
        const prompts = {
            plan: window.app?.settings?.language === 'en'
                ? 'Create a daily plan based on my time and tasks'
                : 'جهز لي خطة يومية مرتبة حسب وقتي ومهامي',
            analyze: window.app?.settings?.language === 'en'
                ? 'Analyze my tasks and suggest the best way to complete them'
                : 'حلل مهامي واقترح أفضل طريقة لإنجازها',
            focus: window.app?.settings?.language === 'en'
                ? 'Suggest a 25-minute focus session'
                : 'اقترح جلسة تركيز لمدة 25 دقيقة',
            habit: window.app?.settings?.language === 'en'
                ? 'Explain a simple way to build a sustainable daily habit'
                : 'اشرح لي أفضل طريقة لبناء عادة يومية مستمرة'
        };
        welcome.querySelectorAll('[data-prompt-key]').forEach(button => {
            button.dataset.prompt = prompts[button.dataset.promptKey];
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
        window.NuvioSync?.scheduleSave();
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
        // Render the complete response in one DOM update. The previous character-by-
        // character loop created hundreds of timers and repeated smooth-scroll calls
        // for long answers, which made the chat feel sluggish on lower-end devices.
        const message = appendMessage('assistant', escapeText(text));
        message.classList.add('ai-message-enter');
        return message;
    }

    function appendRetryButton(message, failedPrompt) {
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'ai-retry';
        retry.textContent = aiT('retry');
        retry.addEventListener('click', () => {
            dom.input.value = failedPrompt;
            dom.input.dispatchEvent(new Event('input'));
            sendMessage();
        });
        message.appendChild(retry);
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

    function normalizeDigits(value) {
        return String(value || '').replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
    }

    function inferDirectReminder(message) {
        const raw = normalizeDigits(message);
        const trigger = /(?:فكرني|ذكرني|افتكرني|نبهني|اعملي?\s+تذكير)/i;
        if (!trigger.test(raw)) return [];

        const timePattern = /(?:على\s+الساعة|علي\s+الساعة|الساعة|على|علي|عند)\s*(\d{1,2})(?::(\d{2}))?\s*(صباحا|صباحًا|الصبح|صبح|مساء|مساءً|بالليل|ليل|ظهر|بعد\s+الظهر)?/i;
        const match = timePattern.exec(raw);
        if (!match) return [];

        let messageText = (raw.slice(0, match.index) + ' ' + raw.slice(match.index + match[0].length))
            .replace(trigger, '')
            .replace(/^(?:مثلا|مثلًا|لو سمحت|من فضلك)\s*/i, '')
            .replace(/[،,.!؟]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        let hour = Number(match[1]);
        const minute = Number(match[2] || 0);
        const period = String(match[3] || '').replace(/\s/g, '');
        if (!messageText || hour < 1 || hour > 12 || minute > 59) return [];

        const morning = /صباح|صبح/.test(period);
        const evening = /مساء|ليل/.test(period);
        const noon = /ظهر/.test(period);
        if (morning) hour = hour === 12 ? 0 : hour;
        else if (evening) hour = hour === 12 ? 12 : hour + 12;
        else if (noon) hour = hour === 12 ? 12 : hour + 12;
        else if (/أ?فطر|فطار|الفطار|breakfast/i.test(messageText) && hour <= 11) {
            // Breakfast is a clear morning context.
        } else {
            return [];
        }

        const now = new Date();
        const due = new Date(now);
        due.setHours(hour, minute, 0, 0);
        if (due <= now) due.setDate(due.getDate() + 1);
        return [{ type: 'add_reminder', reminder: { message: messageText, remindAt: due.toISOString() } }];
    }

    function inferDirectActions(message) {
        const text = String(message).toLowerCase();
        const actions = inferDirectReminder(message);
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
                endDate: task.endDate,
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

    async function executeActions(actions) {
        if (!window.app || !Array.isArray(actions)) return 0;
        let count = 0;
        let changedTasks = false;

        for (const action of actions) {
            if (!action?.type) continue;

            if (['delete_task', 'delete_note', 'delete_habit'].includes(action.type)) {
                // Destructive actions are confirmed before execution.
                const confirmed = await askForConfirmation(aiT('deleteSelected'));
                if (!confirmed) continue;
            }

            if (action.type === 'navigate') {
                const sections = ['dashboard', 'tasks', 'focus', 'calendar', 'reports', 'habits', 'prayer', 'sleep', 'water', 'notes', 'settings', 'ai'];
                if (sections.includes(action.section)) {
                    window.app.showSection(action.section);
                    count++;
                }
                continue;
            }

            if (action.type === 'set_theme') {
                const dark = action.dark !== false;
                if (window.app.settings.darkMode !== dark) window.app.toggleTheme();
                count++;
                continue;
            }

            if (action.type === 'add_habit') {
                const input = action.habit || {};
                if (!input.title) continue;
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
                continue;
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
                continue;
            }

            if (action.type === 'delete_habit') {
                const value = String(action.habit || '').trim().toLowerCase();
                const matches = window.app.habits.filter(habit =>
                    habit.id === action.habit || habit.title?.toLowerCase() === value
                );
                const partial = matches.length ? matches : window.app.habits.filter(habit =>
                    habit.title?.toLowerCase().includes(value)
                );
                if (partial.length !== 1) continue;
                window.app.habits = window.app.habits.filter(habit => habit.id !== partial[0].id);
                window.app.saveHabits();
                window.app.renderHabits();
                count++;
                continue;
            }

            if (action.type === 'add_water_glass') {
                if (typeof window.app.addWaterGlass === 'function') {
                    window.app.addWaterGlass();
                    count++;
                }
                continue;
            }

            if (action.type === 'set_water_goal') {
                const goal = Number(action.goal);
                if (Number.isInteger(goal) && goal > 0 && goal <= 30 && window.app.waterData) {
                    window.app.updateWaterGoal(goal);
                    count++;
                }
                continue;
            }

            if (action.type === 'add_note') {
                const input = action.note || {};
                const title = String(input.title || '').trim().slice(0, 150);
                if (!title || !Array.isArray(window.app.notes)) continue;
                const content = String(input.content || '').trim().slice(0, 10000);
                const duplicate = window.app.notes.some(note =>
                    note.title.toLowerCase() === title.toLowerCase() && note.content === content
                );
                if (duplicate) continue;
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
                continue;
            }

            if (action.type === 'update_note') {
                const note = findNote(action.note);
                if (!note) continue;
                const changes = action.changes || {};
                if (typeof changes.title === 'string' && changes.title.trim()) note.title = changes.title.trim().slice(0, 150);
                if (typeof changes.content === 'string') note.content = changes.content.slice(0, 10000);
                if (Array.isArray(changes.tags)) note.tags = changes.tags.slice(0, 10).map(tag => String(tag).slice(0, 40));
                note.updatedAt = new Date().toISOString();
                window.app.saveNotes();
                window.app.renderNotes();
                count++;
                continue;
            }

            if (action.type === 'delete_note') {
                const note = findNote(action.note);
                if (!note) continue;
                window.app.notes = window.app.notes.filter(item => item.id !== note.id);
                window.app.saveNotes();
                window.app.renderNotes();
                count++;
                continue;
            }

            if (action.type === 'add_reminder') {
                const reminder = action.reminder || {};
                const remindAt = new Date(reminder.remindAt);
                const message = String(reminder.message || '').trim().slice(0, 240);
                if (!message || Number.isNaN(remindAt.getTime()) || remindAt <= new Date()) continue;
                window.app.addNotification('reminder', message, remindAt);
                count++;
                continue;
            }

            if (action.type === 'start_focus') {
                window.app.startTimer();
                count++;
                continue;
            }

            if (action.type === 'clear_notifications') {
                window.app.clearNotifications();
                count++;
                continue;
            }

            if (action.type === 'add_task') {
                const input = action.task || {};
                if (!input.title) continue;
                const due = input.dueDate && !Number.isNaN(Date.parse(input.dueDate))
                    ? new Date(input.dueDate).toISOString()
                    : null;
                const duplicate = due && window.app.tasks.some(task =>
                    task.title === String(input.title).trim() && task.dueDate === due
                );
                if (duplicate) continue;

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
                        : (input.autoStart && due
                            ? new Date(Date.parse(due) + Math.min(1440, Math.max(1, parseInt(input.estimatedTime, 10) || 25)) * 60000).toISOString()
                            : null),
                    autoStart: input.autoStart === true,
                    estimatedTime: Math.min(1440, Math.max(1, parseInt(input.estimatedTime, 10) || 25)),
                    actualTime: 0,
                    repeat: ['none', 'daily', 'weekly', 'monthly'].includes(input.repeat) ? input.repeat : 'none',
                    reminder: [0, 15, 30, 60, 1440].includes(Number(input.reminder)) ? Number(input.reminder) : 0,
                    tags: Array.isArray(input.tags) ? input.tags.slice(0, 10) : [],
                    createdAt: new Date().toISOString(),
                    completedAt: null
                });
                const createdTask = window.app.tasks[0];
                if (createdTask?.dueDate && createdTask.reminder > 0) {
                    const remindAt = new Date(new Date(createdTask.dueDate).getTime() - createdTask.reminder * 60000);
                    if (remindAt > new Date()) {
                        window.app.addNotification('task', 'تذكير: ' + createdTask.title, remindAt, createdTask.id);
                    }
                }
                count++;
                changedTasks = true;
                continue;
            }

            const task = findTask(action.task);
            if (!task) continue;

            if (action.type === 'delete_task') {
                window.app.tasks = window.app.tasks.filter(item => item.id !== task.id);
                window.app.notifications = window.app.notifications.filter(item => item.taskId !== task.id);
                count++;
                changedTasks = true;
            } else if (action.type === 'complete_task') {
                task.status = task.status === 'completed' ? 'pending' : 'completed';
                task.completedAt = task.status === 'completed' ? new Date().toISOString() : null;
                if (task.status === 'completed') window.app.createNextRecurringTask?.(task);
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
                    else continue;
                    window.app.notifications = window.app.notifications.filter(item => item.taskId !== task.id);
                    if (task.dueDate && Number(task.reminder) > 0) {
                        const remindAt = new Date(new Date(task.dueDate).getTime() - Number(task.reminder) * 60000);
                        if (remindAt > new Date()) window.app.addNotification('task', 'تذكير: ' + task.title, remindAt, task.id);
                    }
                }
                if (changes.title) {
                    window.app.notifications.forEach(item => {
                        if (item.taskId === task.id && !item.firedAt) item.message = 'تذكير: ' + task.title;
                    });
                }
                const hasOtherChange = Boolean(changes.title || changes.description !== undefined || changes.category || changes.priority || changes.estimatedTime);
                if (hasOtherChange || Object.prototype.hasOwnProperty.call(changes, 'dueDate')) { count++; changedTasks = true; }
            }
        }

        if (changedTasks) {
            window.app.saveData();
            window.app.renderAll();
        }
        return count;
    }

    function parseScheduleClock(value, periodHint = '', referenceMinutes = null, role = 'start') {
        const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
        if (!match) return null;
        const hour = Number(match[1]);
        const minute = Number(match[2]);
        if (minute > 59 || hour > 23) return null;
        if (hour > 12) return hour * 60 + minute;

        const hint = String(periodHint || '').replace(/\s+/g, '').toLowerCase();
        const adjustNextDay = value => referenceMinutes !== null && referenceMinutes >= 24 * 60 && value < referenceMinutes - 15
            ? value + 24 * 60 : value;
        if (/صباح|صبح|ص/.test(hint)) return adjustNextDay((hour === 12 ? 0 : hour) * 60 + minute);
        if (/مساء|ليل|م/.test(hint)) return adjustNextDay((hour === 12 ? 12 : hour + 12) * 60 + minute);
        if (/ظهر/.test(hint)) return adjustNextDay((hour === 12 ? 12 : hour + 12) * 60 + minute);

        const base = hour === 12 ? 12 * 60 + minute : hour * 60 + minute;
        let candidates = [base, (hour === 12 ? 12 * 60 : (hour + 12) * 60) + minute];
        if (referenceMinutes === null) return candidates[0];
        if (referenceMinutes >= 24 * 60) {
            candidates = candidates.map(candidate => candidate < referenceMinutes - 15 ? candidate + 24 * 60 : candidate);
        }
        const valid = candidates.filter(candidate => role === 'start'
            ? candidate >= referenceMinutes - 15
            : candidate > referenceMinutes);
        if (valid.length) return valid.sort((a, b) => Math.abs(a - referenceMinutes) - Math.abs(b - referenceMinutes))[0];
        return candidates[1];
    }

    function parseSchedule(message) {
        const actions = [];
        const now = new Date();
        const dateAtMinutes = minutes => {
            const date = new Date(now);
            date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
            return date;
        };
        const periodPattern = '(صباحًا|صباحا|الصبح|صبح|مساءً|مساء|بالليل|ليل|ظهر|بعد\\s+الظهر|ص|م)';
        const rangePattern = new RegExp(
            '(\\d{1,2}:\\d{2})\\s*' + periodPattern + '?\\s*[–—-]\\s*(\\d{1,2}:\\d{2})\\s*' + periodPattern + '?',
            'i'
        );
        const singleTimePattern = new RegExp('^(\\d{1,2}:\\d{2})\\s*' + periodPattern + '?$', 'i');
        const studyPattern = /مذاكر|مراجعة|راجع|حل\b|محاضرة|حفظ|تسميع|دراسة|study|revision|practice|biology|physics|chemistry|english|math|calculus|برمجة|كود|coding|programming|تفسير|توحيد|فقه|حديث|نحو|صرف|بلاغة|أحياء|فيزياء|كيمياء|إنجليزي|انجليزي|رياضيات/i;
        const islamPattern = /صلاة|أذكار|اذكار|قرآن|قران|شرعي|مسجد/i;

        const rawLines = String(message || '').replace(/&#x20;/gi, ' ').split(/\r?\n/);
        const lines = rawLines.map(line => line
            .replace(/^\s*#+\s*/, '')
            .replace(/\*\*/g, '')
            .replace(/^\s*\|\s*[-: ]+\s*\|\s*$/, '')
            .replace(/^\s*\|\s*$/, '')
            .replace(/\|/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .trim()
        ).filter(line => line && !/^[-:| ]+$/.test(line) && !/^الوقت$|^النشاط$|^جدول المذاكرة/i.test(line));

        const entries = [];
        for (let i = 0; i < lines.length; i++) {
            const match = rangePattern.exec(lines[i]);
            const singleMatch = match ? null : singleTimePattern.exec(lines[i]);
            if (!match && !singleMatch) continue;
            let title = match ? lines[i].replace(match[0], ' ').replace(/[*_]/g, ' ').trim() : '';
            if (!title) {
                for (let j = i + 1; j < lines.length; j++) {
                    if (rangePattern.test(lines[j]) || singleTimePattern.test(lines[j])) break;
                    if (/^(تقريبًا|تقريبا|حوالي)$/.test(lines[j])) continue;
                    title = lines[j].replace(/^[\s|:؛-]+/, '').trim();
                    break;
                }
            }
            if (title) entries.push({ match: match || singleMatch, title, single: Boolean(singleMatch) });
        }

        let previousEnd = null;
        for (const entry of entries) {
            const match = entry.match;
            const firstPeriod = match[2] || '';
            const secondPeriod = entry.single ? firstPeriod : (match[4] || firstPeriod);
            const startMinutes = parseScheduleClock(match[1], firstPeriod || secondPeriod, previousEnd, 'start');
            if (startMinutes === null) continue;
            let endMinutes = entry.single
                ? startMinutes
                : parseScheduleClock(match[3], secondPeriod || firstPeriod, startMinutes, 'end');
            if (endMinutes === null) continue;

            if (!entry.single && endMinutes <= startMinutes && (/صباح|صبح|ص/.test(secondPeriod) || (!secondPeriod && startMinutes >= 18 * 60 && endMinutes < 12 * 60))) {
                endMinutes += 24 * 60;
            }
            if (!entry.single && endMinutes <= startMinutes) continue;

            const startDate = dateAtMinutes(startMinutes);
            const endDate = entry.single ? null : dateAtMinutes(endMinutes);
            const title = entry.title.replace(/^[\s|:؛-]+|[\s|]+$/g, '').replace(/[*_]/g, '').trim();
            if (!title) continue;
            const isStudy = !entry.single && studyPattern.test(title) && !/حصة|درس مباشر|محاضرة مباشرة|استراحة|راحة/i.test(title);
            const category = isStudy ? (/برمجة|كود|coding|programming/i.test(title) ? 'coding' : 'study')
                : islamPattern.test(title) ? 'Islam' : /تمرين|رياضة|جيم/i.test(title) ? 'sport' : 'personal';

            actions.push({
                type: 'add_task',
                task: {
                    title: title.slice(0, 150),
                    description: entry.single ? 'موعد محدد ضمن جدول اليوم' : 'موعد ضمن جدول اليوم من ' + match[1] + ' إلى ' + match[3],
                    category,
                    priority: isStudy ? 'high' : 'medium',
                    dueDate: startDate.toISOString(),
                    endDate: endDate ? endDate.toISOString() : null,
                    autoStart: isStudy,
                    estimatedTime: entry.single ? 25 : Math.max(1, Math.round((endDate - startDate) / 60000)),
                    tags: ['جدول اليوم']
                }
            });
            previousEnd = entry.single ? startMinutes : endMinutes;
        }
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
        const isFirstMessage = chat.messages.length === 0;
        chat.messages.push({ role: 'user', content: text });
        chat.updatedAt = Date.now();
        appendMessage('user', text);
        saveHistory();
        renderHistory();


        const typing = showTyping();
        try {
            // Deterministic schedule parsing must not depend on the model returning valid JSON.
            const localScheduleActions = parseSchedule(text);
            if (localScheduleActions.length) {
                typing.remove();
                const scheduleCount = settings.actionsEnabled ? await executeActions(localScheduleActions) : 0;
                const scheduleReply = settings.actionsEnabled
                    ? (scheduleCount === localScheduleActions.length
                        ? 'تم حفظ جدولك كاملًا. مهام المذاكرة ستبدأ تلقائيًا في مواعيدها.'
                        : 'تمت إضافة ' + scheduleCount + ' من ' + localScheduleActions.length + ' نشاطًا. راجع المهام للتأكد من الباقي.')
                    : 'تم تحليل الجدول، لكن تنفيذ الأوامر متوقف من إعدادات المساعد.';
                if (isFirstMessage) {
                    const mainTaskTitle = localScheduleActions.find(action => action.type === 'add_task')?.task?.title;
                    if (mainTaskTitle) chat.title = String(mainTaskTitle).slice(0, 48);
                    if (dom.title) dom.title.textContent = chat.title;
                    renderHistory();
                    saveHistory();
                }
                await animateReply(scheduleReply);
                chat.messages.push({ role: 'assistant', content: scheduleReply });
                saveHistory();
                return;
            }
            const session = await window.NuvioCloud?.getSession();
            if (!session?.access_token) throw new Error(aiT('loginRequired'));

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
            if (response.status === 401) throw new Error(aiT('loginRequired'));
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'تعذر الاتصال بالمساعد');
            typing.remove();

            const result = parseJSON(data.reply);
            if (isFirstMessage && typeof result.title === 'string' && result.title.trim()) {
                chat.title = result.title.trim().replace(/[\\r\\n]+/g, ' ').slice(0, 48);
                if (dom.title) dom.title.textContent = chat.title;
                renderHistory();
                saveHistory();
            }
            const directReminderActions = inferDirectReminder(text);
            const scheduleActions = parseSchedule(text);
            const relativeDateActions = inferRelativeTaskDateActions(text);
            if (directReminderActions.length) {
                result.actions = directReminderActions;
                result.reply = 'تم ضبط التذكير في الموعد المطلوب.';
            } else if (scheduleActions.length) {
                const normalizeScheduleTitle = value => String(value || '').toLowerCase()
                    .replace(/[ًٌٍَُِّْـ]/g, '')
                    .replace(/[أإآ]/g, 'ا')
                    .replace(/[^\u0600-\u06FF\w\s]/g, ' ')
                    .replace(/\s+/g, ' ').trim();
                const explicitKeys = new Set(scheduleActions.map(action =>
                    normalizeScheduleTitle(action.task?.title) + '|' + String(action.task?.dueDate || '')
                ));
                const explicitTitles = new Set(scheduleActions.map(action => normalizeScheduleTitle(action.task?.title)));
                const remainingModelActions = (Array.isArray(result.actions) ? result.actions : []).filter(action => {
                    if (action?.type !== 'add_task') return true;
                    const title = normalizeScheduleTitle(action.task?.title);
                    const key = title + '|' + String(action.task?.dueDate || '');
                    return !explicitKeys.has(key) && !explicitTitles.has(title);
                });
                result.actions = [...scheduleActions, ...remainingModelActions].slice(0, 30);
                result.reply = 'تم حفظ الفترات المحددة في الجدول، مع الاحتفاظ بباقي الأنشطة التي لا تحتوي على وقت دقيق.';
            } else if (relativeDateActions.length) {
                result.actions = relativeDateActions;
                result.reply = relativeDateActions.length === 1
                    ? 'تم تحديث موعد المهمة إلى التاريخ المطلوب.'
                    : `تم تحديث مواعيد ${relativeDateActions.length} مهمة نشطة إلى التاريخ المطلوب.`;
            }
            if (!directReminderActions.length && (!Array.isArray(result.actions) || !result.actions.length)) {
                const direct = inferDirectActions(text);
                if (direct.length) {
                    result.actions = direct;
                    if (!result.reply || /لم أفهم|لا أفهم|اعتذر/i.test(result.reply)) {
                        result.reply = direct.length === 1 ? 'تم تنفيذ الأمر.' : `تم تنفيذ ${direct.length} إجراءات.`;
                    }
                }
            }
            const actions = settings.actionsEnabled ? result.actions : [];
            const count = await executeActions(actions);
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
            const isNetworkError = error instanceof TypeError
                || /failed to fetch|networkerror|load failed/i.test(String(error.message || ''));
            const reply = isNetworkError
                ? aiT('networkError')
                : error.message || aiT('networkError');
            const message = await animateReply(reply);
            if (isNetworkError) appendRetryButton(message, text);
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
        dom.back = document.getElementById('aiBackToApp');
        dom.mobileMenu = document.getElementById('mobileMenu');
        dom.sidebar = document.getElementById('aiSidebar');
        dom.settingsPanel = document.getElementById('aiSettingsPanel');
        dom.settingsBackdrop = document.getElementById('aiSettingsBackdrop');

        if (!dom.section || !dom.messages || !dom.input || !dom.send) return;

        loadHistory();
        dom.newChat?.addEventListener('click', createChat);
        dom.back?.addEventListener('click', () => { window.location.href = './index.html'; });
        dom.clear?.addEventListener('click', async () => {
            const chat = currentChat();
            if (!chat) return;
            if (!await askForConfirmation(aiT('clearMessages'))) return;
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
            if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
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

    window.addEventListener('nuvio:remote-state-applied', () => {
        loadHistory();
        if (dom.messages && document.getElementById('aiSection')?.classList.contains('active')) {
            activeId = conversations[0]?.id || null;
            if (activeId) render();
            else createChat();
        }
    });

    initialize();
    window.NuvioAI = {
        refreshLanguage() {
            if (currentChat()?.messages.length === 0) render();
            else renderHistory();
            syncSettings();
        }
    };
})();
