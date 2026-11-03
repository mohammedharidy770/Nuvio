export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY is missing.' });
        const message = req.body?.message;
        if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Message is required.' });
        const preferences = req.body?.preferences || {};
        const tone = preferences.tone === 'detailed'
            ? 'كن مفصلًا ومنظمًا مع نقاط واضحة.'
            : preferences.tone === 'friendly'
                ? 'كن ودودًا ومشجعًا وتجنب الجفاف.'
                : 'كن مختصرًا ومباشرًا قدر الإمكان.';
        const actionsEnabled = preferences.actionsEnabled !== false;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: `أنت AI Nuvio، مساعد شخصي عربي يفهم العامية المصرية والعربية الفصحى المختلطة والمنطق البشري.
${tone}
${actionsEnabled ? 'نفذ الإجراءات المطلوبة داخل التطبيق.' : 'لا تنفذ أي إجراءات داخل التطبيق؛ اكتفِ بالنصيحة والشرح في reply.'}
افهم الاختصارات والمرادفات: "اعمللي"/"اعملي" = نفذ؛ "ظبطلي الجدول" = أنشئ مهام لكل فترة؛ "امسح"/"شيل" = حذف بعد تحديد المهمة؛ "كمّل"/"خلصت" = إكمال؛ "جهزلي اليوم" = خطط اليوم؛ "روح لـ..." = navigate.
لا تستخدم عبارة "لم أفهم" أو "لا أملك صلاحية" لأي أمر مرتبط بتطبيق Nuvio. افترض النية الأبسط، نفذها بـ actions، ولا ترد ردًا عامًا.
الأوقات العربية البشرية لا تبدأ بصفر دائمًا: 9 صباحًا هو 09:00، 2 ظهرًا هو 14:00، 6 مساءً هو 18:00، 7 مساءً = 19:00. ما تخترعش بيانات ولا تعيد صياغة الأمر بلا تنفيذ مطلوب. اسأل بلطف فقط إذا كان الاسم أو الوقت مجهولًا تمامًا.
اعمل على حالة المستخدم كاملة، ولخص ما تنفذه بلغة قصيرة. لا تكرر الكلام، ولا تسأل عن تأكيد عند أمر واضح؛ نفذ وإلا وضح السبب.
إذا طلب المستخدم "اقرأ الموقع" أو "اعرف كل حاجات الموقع" فاستخدم context كله واذكر ملخصًا مفيدًا للمهام والعادات والحالة. إذا طلب منظمًا/جدولًا أنشئ add_task لكل عنصر واضح مع التاريخ والوقت الصحيحين عندما تتوفر البيانات.
أعد JSON فقط بالشكل {"reply":"رد بالمصري الطبيعي","actions":[{"type":"add_task","task":{"title":"عنوان","description":"شرح","category":"study","priority":"medium","dueDate":"ISO datetime أو null","estimatedTime":90,"repeat":"none","reminder":0,"tags":[]}}]}.
الأنواع المتاحة: add_task, update_task, delete_task, complete_task, start_task, add_habit, complete_habit, delete_habit, toggle_habit, add_water_glass, start_focus, clear_notifications, navigate, set_theme. استخدم task للاعمال وhabit للعادات. navigate sections: dashboard/tasks/focus/calendar/reports/habits/prayer/sleep/water/notes/settings/ai. نفذ الطلب مباشرة ولا تسأل تأكيدًا للأوامر الواضحة. أمثلة: فتح العادات => navigate habits، الوضع الداكن => set_theme dark=true، كوب مياه => add_water_glass.`
                    },
                    { role: 'user', content: JSON.stringify({
                        message: message.trim(),
                        context: req.body?.context || {},
                        history: Array.isArray(req.body?.history) ? req.body.history.slice(-10) : []
                    }) }
                ]
            })
        });
        const data = await response.json();
        if (!response.ok) return res.status(502).json({ error: data.error?.message || 'OpenAI request failed.' });
        const reply = data.choices?.[0]?.message?.content;
        if (!reply) return res.status(502).json({ error: 'No valid reply received.' });
        return res.status(200).json({ reply });
    } catch (error) {
        console.error('Nuvio Server Error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}
