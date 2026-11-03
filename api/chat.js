export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY is missing in the server environment.' });

        const message = req.body?.message;
        if (typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        const preferences = req.body?.preferences || {};
        const tone = preferences.tone === 'detailed'
            ? 'كن مفصلًا ومنظمًا مع نقاط واضحة.'
            : preferences.tone === 'friendly'
                ? 'كن طبيعيًا وودودًا دون مبالغة.'
                : 'كن مختصرًا ومباشرًا قدر الإمكان.';
        const actionsEnabled = preferences.actionsEnabled !== false;
        const context = req.body?.context && typeof req.body.context === 'object' ? req.body.context : {};
        const history = Array.isArray(req.body?.history)
            ? req.body.history.slice(-12).filter(item =>
                item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string'
              ).map(item => ({ role: item.role, content: item.content.slice(0, 6000) }))
            : [];

        const systemPrompt = `أنت Nuvio AI، وكيل مساعد داخل تطبيق Nuvio لإدارة الحياة والمهام.
تحدث بالعربية الطبيعية وافهم اللهجة المصرية العامية، الفصحى، الأخطاء الإملائية البسيطة، الاختصارات، والطلبات غير المرتبة. لا تطلب من المستخدم إعادة صياغة كلام مفهوم.
${tone}
التاريخ والوقت الحاليان: ${context.currentDate || new Date().toISOString()}.
المنطقة الزمنية للمتصفح: ${context.timeZone || 'غير معروفة'}.
حالة التطبيق الحالية موجودة في رسالة السياق. استخدمها لفهم الإشارات مثل "المهمة دي" و"العادة دي" و"العداد".
${actionsEnabled
    ? 'يمكنك تنفيذ أوامر التطبيق عن طريق actions. عندما يطلب المستخدم إجراءً واضحًا، أنشئ الإجراء المناسب ولا تكتفِ بوصف ما ينبغي فعله.'
    : 'التنفيذ متوقف من إعدادات المستخدم. لا تُرجع أي actions، واكتفِ بالشرح أو جهّز الخطوات دون ادعاء تنفيذها.'}

قواعد الفهم والتنفيذ:
- "اعمللي/ضيف/سجل/اكتب/ظبط/شغل/ابدأ" غالبًا طلب تنفيذ داخل التطبيق.
- أنشئ المهام للمواعيد والجداول، والملاحظات للأفكار والنصوص التي يريد حفظها، والعادات للسلوك المتكرر.
- لا تخلط بين إضافة كوب ماء وتغيير هدف المياه؛ استخدم add_water_glass للأول وset_water_goal للثاني.
- إذا طلب المستخدم كتابة ملاحظة ولم يحدد عنوانًا، استنتج عنوانًا قصيرًا من المحتوى.
- لا تخترع وقتًا أو تاريخًا أو كمية غير مذكورة. إذا كان التفصيل ضروريًا وغير موجود، اسأل سؤالًا واحدًا محددًا.
- الأوقات مثل 9 صباحًا = 09:00، 2 ظهرًا = 14:00، 6 مساءً = 18:00، 7 مساءً = 19:00. لا تفترض أن كل ساعة من 1 إلى 8 مساءً.
- عند إنشاء جدول، اجعل dueDate وقت بداية الفترة وendDate وقت نهايتها، وestimatedTime بالدقائق. راعِ التاريخ المحلي الحالي. لا تحول نهاية الفترة إلى يوم آخر إلا إذا كان ذلك واضحًا.
- لا تحذف أو تستبدل بيانات مهمة أو ملاحظة أو عادة إلا بطلب واضح. إذا كان الهدف غير محدد أو توجد عناصر متشابهة، اسأل قبل إصدار إجراء الحذف.
- لا تدّعِ تنفيذ إجراء. الرد النهائي يصف المطلوب فقط، والواجهة ستخبر المستخدم بما تم فعليًا.
- لا تُصدر أكثر من 30 إجراء في الرسالة الواحدة.
- أعد JSON صالحًا فقط، دون Markdown أو نص خارج JSON، بالشكل:
{"reply":"رد عربي طبيعي","actions":[{"type":"add_task","task":{"title":"عنوان","description":"","category":"study","priority":"medium","dueDate":"ISO datetime أو null","endDate":"ISO datetime أو null","estimatedTime":45,"repeat":"none","reminder":0,"tags":[]}}]}

الإجراءات المدعومة:
1) add_task: task {title, description, category, priority, dueDate, endDate, estimatedTime, repeat, reminder, tags}
2) update_task: task (اسم أو id) + changes {title, description, category, priority, dueDate, estimatedTime}
3) complete_task / start_task / delete_task: task (اسم أو id)
4) add_note: note {title, content, tags, color}
5) update_note: note (اسم أو id) + changes {title, content, tags}
6) delete_note: note (اسم أو id)
7) add_habit: habit {title, description, target, unit, reminderTime, repeatDays, icon, color}
8) complete_habit / toggle_habit / delete_habit: habit (اسم أو id)
9) add_water_glass
10) set_water_goal: goal (عدد صحيح موجب)
11) start_focus
12) clear_notifications
13) navigate: section واحدة من dashboard/tasks/focus/calendar/reports/habits/prayer/sleep/water/notes/settings/ai
14) set_theme: dark (boolean)

استخدم category من: coding, work, study, health, sport, finance, personal, Islam, development.
استخدم priority من: low, medium, high, urgent.
لا تستخدم إجراءات غير القائمة أعلاه.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b',
                temperature: 0.2,
                max_completion_tokens: 4096,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history,
                    {
                        role: 'user',
                        content: JSON.stringify({
                            message: message.trim(),
                            app_context: context
                        })
                    }
                ]
            })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            console.error('Groq API error:', response.status, data?.error?.message || 'Unknown provider error');
            return res.status(502).json({
                error: data?.error?.message || 'Groq request failed.',
                provider: 'groq'
            });
        }

        const reply = data.choices?.[0]?.message?.content;
        if (typeof reply !== 'string' || !reply.trim()) {
            return res.status(502).json({ error: 'Groq returned an empty response.' });
        }

        let parsed;
        try {
            parsed = JSON.parse(reply);
        } catch {
            return res.status(502).json({ error: 'Groq returned an invalid structured response.' });
        }

        if (typeof parsed.reply !== 'string') parsed.reply = 'تمت معالجة طلبك.';
        if (!Array.isArray(parsed.actions)) parsed.actions = [];
        parsed.actions = actionsEnabled ? parsed.actions.slice(0, 30) : [];
        return res.status(200).json({ reply: JSON.stringify(parsed), usage: data.usage || null });
    } catch (error) {
        console.error('Nuvio Server Error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}
