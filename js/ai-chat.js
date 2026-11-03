const AI_CHAT_API = 'https://nuvio-blue.vercel.app/api/chat';
const aiChatHistory = [];

function toScheduledDate(time, reference = new Date()) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
    if (!match) return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours >= 1 && hours <= 8) hours += 12;
    const date = new Date(reference);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function parseUserSchedule(message) {
    if (!/(\d{1,2}:\d{2})/.test(message) || !/[–-]/.test(message)) return [];
    const actions = [];
    const lines = message.split(/\n+/).map(line => line.trim()).filter(Boolean);

    lines.forEach((line) => {
        const range = /(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/.exec(line);
        if (!range) {
            const after = /بعد\s+(\d{1,2}:\d{2})/.exec(line);
            if (!after) return;
            const start = toScheduledDate(after[1]);
            if (!start) return;
            const end = new Date(start.getTime() + 60 * 60000);
            const title = line.replace(after[0], '').replace(/^[\t|:.\s]+/, '').replace(/^[🌙]+\s*/, '').trim() || 'وقت مفتوح وراحة';
            actions.push({
                type: 'add_task',
                task: {
                    title, description: `يبدأ بعد ${after[1]}`,
                    category: 'personal', priority: 'low', dueDate: start.toISOString(),
                    endDate: end.toISOString(), estimatedTime: 60, repeat: 'none', reminder: 0,
                    tags: ['جدول اليوم']
                }
            });
            return;
        }
        const start = toScheduledDate(range[1]);
        let end = toScheduledDate(range[2], start || new Date());
        if (!start || !end) return;
        if (end <= start && end.getHours() < 12) end.setDate(end.getDate() + 1);

        const title = line.replace(range[0], '')
            .replace(/^[\t|:.\s]+/, '')
            .replace(/[\t|:.\s]+$/, '')
            .replace(/^[🧪🧬📚🕌☕🍽️🌙]+\s*/, '')
            .trim();
        if (!title) return;

        const lowerTitle = title.toLowerCase();
        let category = 'study';
        if (/صلاة|شرعي|مغرب|ظهر|عصر|عشاء/.test(lowerTitle)) category = 'Islam';
        else if (/راحة|غداء|عشاء|مشروبات/.test(title)) category = 'personal';
        else if (/عربي/.test(title)) category = 'study';

        actions.push({
            type: 'add_task',
            task: {
                title,
                description: `من ${range[1]} إلى ${range[2]}`,
                category,
                priority: /كيمياء|أحياء|عربي|شرعي/.test(title) ? 'high' : 'medium',
                dueDate: start.toISOString(),
                endDate: end.toISOString(),
                estimatedTime: Math.max(1, Math.round((end - start) / 60000)),
                repeat: 'none',
                reminder: 0,
                tags: ['جدول اليوم']
            }
        });
    });
    return actions;
}

function toggleAIChat() {
    const chatBox = document.getElementById('ai-chat-box');
    const button = document.getElementById('ai-chat-btn');
    const opening = !chatBox.classList.contains('open');
    chatBox.classList.toggle('open', opening);
    button.setAttribute('aria-expanded', String(opening));
    if (opening) document.getElementById('ai-user-input')?.focus();
}

function appendAIMessage(text, role = 'assistant') {
    const logsContainer = document.getElementById('ai-chat-logs');
    const message = document.createElement('div');
    message.className = `ai-chat-message ai-chat-message-${role}`;
    message.textContent = text;
    logsContainer.appendChild(message);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    return message;
}

function parseAssistantJSON(value) {
    try {
        return JSON.parse(value);
    } catch {
        const match = value.match(/\{[\s\S]*\}/);
        if (!match) return { reply: value, actions: [] };
        try { return JSON.parse(match[0]); } catch { return { reply: value, actions: [] }; }
    }
}

function executeAIAction(action) {
    if (typeof window.app !== 'object') return false;
    const categories = ['coding', 'work', 'study', 'health', 'sport', 'finance', 'personal', 'Islam', 'development'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const findTask = (target) => {
        if (!target) return null;
        const title = String(target.title || target.id || target).trim();
        return window.app.tasks.find(task =>
            task.id === title ||
            task.title === title ||
            task.title.includes(title)
        );
    };

    if (action.type === 'navigate') {
        const section = String(action.section || '').trim();
        document.querySelector(`.nav-item[data-section="${section}"]`)?.click();
        return Boolean(section);
    }

    if (action.type === 'set_theme') {
        const dark = action.dark !== false;
        if (window.app.settings.darkMode !== dark) window.app.toggleTheme();
        return true;
    }

    if (action.type === 'delete_task') {
        const task = findTask(action.task);
        if (!task) return false;
        window.app.tasks = window.app.tasks.filter(item => item.id !== task.id);
        return true;
    }

    if (action.type === 'complete_task' || action.type === 'start_task') {
        const task = findTask(action.task);
        if (!task) return false;
        if (action.type === 'start_task') window.app.startTask(task.id);
        else window.app.toggleTaskComplete(task.id);
        return true;
    }

    if (action.type === 'update_task') {
        const task = findTask(action.task);
        const changes = action.changes || {};
        if (!task) return false;
        if (typeof changes.title === 'string' && changes.title.trim()) task.title = changes.title.trim().slice(0, 150);
        if (typeof changes.description === 'string') task.description = changes.description.trim().slice(0, 1000);
        if (categories.includes(changes.category)) task.category = changes.category;
        if (priorities.includes(changes.priority)) task.priority = changes.priority;
        if (changes.dueDate && !Number.isNaN(Date.parse(changes.dueDate))) task.dueDate = new Date(changes.dueDate).toISOString();
        if (changes.estimatedTime !== undefined) task.estimatedTime = Math.min(1440, Math.max(1, parseInt(changes.estimatedTime, 10) || task.estimatedTime));
        return true;
    }

    if (action.type !== 'add_task' || !action.task?.title) return false;
    const task = {
        id: 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        title: String(action.task.title).trim().slice(0, 150),
        description: String(action.task.description || '').trim().slice(0, 1000),
        category: categories.includes(action.task.category) ? action.task.category : 'study',
        priority: priorities.includes(action.task.priority) ? action.task.priority : 'medium',
        status: 'pending',
        dueDate: action.task.dueDate && !Number.isNaN(Date.parse(action.task.dueDate)) ? new Date(action.task.dueDate).toISOString() : null,
        endDate: action.task.endDate && !Number.isNaN(Date.parse(action.task.endDate)) ? new Date(action.task.endDate).toISOString() : null,
        estimatedTime: Math.min(1440, Math.max(1, parseInt(action.task.estimatedTime, 10) || 25)),
        actualTime: 0,
        repeat: ['daily', 'weekly', 'monthly'].includes(action.task.repeat) ? action.task.repeat : 'none',
        reminder: Math.min(1440, Math.max(0, parseInt(action.task.reminder, 10) || 0)),
        tags: Array.isArray(action.task.tags) ? action.task.tags.slice(0, 10).map(tag => String(tag).trim()).filter(Boolean) : [],
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    const duplicate = task.dueDate && window.app.tasks.some(existing =>
        existing.title === task.title &&
        new Date(existing.dueDate).getTime() === new Date(task.dueDate).getTime()
    );
    if (duplicate) return false;
    window.app.tasks.unshift(task);
    return true;
}

async function sendToNuvioAI() {
    const inputElement = document.getElementById('ai-user-input');
    const messageText = inputElement.value.trim();
    if (!messageText) return;

    appendAIMessage(messageText, 'user');
    inputElement.value = '';
    inputElement.style.height = '';
    aiChatHistory.push({ role: 'user', content: messageText });
    const localSchedule = parseUserSchedule(messageText);
    if (localSchedule.length) {
        const addedCount = localSchedule.filter(executeAIAction).length;
        window.app.saveData();
        window.app.renderAll();
        appendAIMessage(`تم تطبيق الجدول مباشرة: أضيفت ${addedCount} مهمة إلى الموقع.\nيمكنك مراجعتها وتعديلها من صفحة المهام.`, 'assistant');
        aiChatHistory.push({ role: 'assistant', content: `تمت إضافة ${addedCount} مهمة من الجدول.` });
        return;
    }
    const loadingMessage = appendAIMessage('جاري التفكير...', 'loading');

    try {
        const context = {
            tasks: window.app?.tasks?.slice(0, 30).map(({ title, status, dueDate, estimatedTime, category }) => ({
                title, status, dueDate, estimatedTime, category
            })) || [],
            currentDate: new Date().toISOString()
        };
        const response = await fetch(AI_CHAT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageText, context, history: aiChatHistory.slice(-10) })
        });
        const data = await response.json();
        loadingMessage.remove();
        if (!response.ok) throw new Error(data.error || 'فشل الاتصال بالمساعد');

        const parsed = parseAssistantJSON(data.reply);
        const actionCount = Array.isArray(parsed.actions) ? parsed.actions.filter(executeAIAction).length : 0;
        if (actionCount) {
            window.app.saveData();
            window.app.renderAll();
        }
        const reply = parsed.reply || data.reply || 'تمت معالجة طلبك.';
        appendAIMessage(actionCount ? `${reply}\nنفّذت ${actionCount} إجراءات مباشرة داخل الموقع.` : reply, 'assistant');
        aiChatHistory.push({ role: 'assistant', content: reply });
    } catch (error) {
        loadingMessage.remove();
        appendAIMessage(error.message || 'حدث خطأ في الاتصال بالخادم.', 'error');
    }
}

document.getElementById('ai-user-input')?.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendToNuvioAI();
    }
});
