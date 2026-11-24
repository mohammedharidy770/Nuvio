Object.assign(NuvioApp.prototype, {
    t(key) {
        const lang = this.settings.language;
        const translations = {
            ar: {
                'nav.dashboard': 'لوحة التحكم', 'nav.tasks': 'المهام', 'nav.focus': 'التركيز',
                'nav.calendar': 'التقويم', 'nav.reports': 'التقارير', 'nav.settings': 'الإعدادات',
                'user.name': 'مستخدم', 'user.role': 'نظام التشغيل الشخصي',
                'pages.dashboard': 'لوحة التحكم', 'pages.tasks': 'المهام', 'pages.focus': 'التركيز',
                'pages.calendar': 'التقويم', 'pages.reports': 'التقارير', 'pages.settings': 'الإعدادات',
                'actions.newTask': 'مهمة جديدة', 'actions.selectTask': 'اختر مهمة',
                'actions.focusSession': 'جلسة تركيز', 'actions.report': 'التقرير',
                'actions.export': 'تصدير', 'actions.viewAll': 'عرض الكل',
                'actions.cancel': 'إلغاء', 'actions.saveTask': 'حفظ المهمة',
                'actions.exportData': 'تصدير البيانات', 'actions.importData': 'استيراد البيانات',
                'actions.clearAll': 'مسح كل البيانات',
                'dashboard.welcome': 'مرحباً بعودتك', 'dashboard.todayProgress': 'تقدم اليوم',
                'dashboard.completed': 'مكتمل', 'dashboard.completedLabel': 'مكتمل',
                'dashboard.totalLabel': 'الكل', 'dashboard.pendingLabel': 'معلق',
                'dashboard.currentTask': 'المهمة الحالية', 'dashboard.noActiveTask': 'لا توجد مهمة نشطة',
                'dashboard.quickActions': 'إجراءات سريعة', 'dashboard.todayStats': 'إحصائيات اليوم',
                'dashboard.tasksCompleted': 'مهمة مكتملة', 'dashboard.focusTime': 'وقت التركيز',
                'dashboard.focusTimer': 'مؤقت التركيز', 'dashboard.motivation': 'رسالة اليوم',
                'dashboard.productivity': 'الإنتاجية', 'dashboard.focusSummary': 'ملخص التركيز',
                'dashboard.onTrack': 'في المسار', 'dashboard.sessions': 'جلسات',
                'dashboard.totalTime': 'الوقت الكلي', 'dashboard.weeklyReport': 'التقرير الأسبوعي',
                'dashboard.focusHours': 'ساعات التركيز', 'dashboard.completedTasks': 'المهام المكتملة',
                'filters.all': 'الكل', 'filters.pending': 'معلقة', 'filters.inProgress': 'قيد التنفيذ',
                'filters.completed': 'مكتملة', 'filters.overdue': 'متأخرة',
                'sort.newest': 'الأحدث', 'sort.priority': 'الأولوية',
                'sort.dueDate': 'موعد النهاية', 'sort.estimatedTime': 'الوقت المقدر',
                'tasks.noTasks': 'لا توجد مهام', 'tasks.createFirst': 'أنشئ أول مهمة للبدء',
                'timer.pomodoro': 'بومودورو', 'timer.shortBreak': 'استراحة قصيرة',
                'timer.longBreak': 'استراحة طويلة', 'timer.start': 'بدء',
                'timer.pause': 'إيقاف مؤقت', 'timer.reset': 'إعادة',
                'timer.noTaskSelected': 'لم يتم اختيار مهمة',
                'focus.sessionStats': 'إحصائيات الجلسة', 'focus.sessions': 'جلسات',
                'focus.focus': 'تركيز', 'focus.break': 'استراحة',
                'focus.productivityGrade': 'درجة الإنتاجية', 'focus.excellent': 'ممتاز',
                'days.sun': 'أحد', 'days.mon': 'إثنين', 'days.tue': 'ثلاثاء',
                'days.wed': 'أربعاء', 'days.thu': 'خميس', 'days.fri': 'جمعة', 'days.sat': 'سبت',
                'calendar.todayTasks': 'مهام اليوم',
                'reports.focusHours': 'ساعات التركيز', 'reports.completedTasks': 'المهام المكتملة',
                'reports.activityMap': 'خريطة النشاط', 'reports.monthlyOverview': 'نظرة شهرية',
                'reports.thisWeek': 'هذا الأسبوع', 'reports.thisMonth': 'هذا الشهر',
                'reports.totalTasks': 'مهام أُضيفت', 'reports.completed': 'مكتملة',
                'reports.focusHoursLabel': 'ساعات تركيز', 'reports.avgProductivity': 'نسبة الإكمال',
                'reports.periodOverview': 'ملخص الفترة', 'reports.last7Days': 'آخر 7 أيام',
                'reports.last30Days': 'آخر 30 يومًا',
                'reports.periodSelector': 'فترة التقرير', 'reports.completedLegend': 'تصنيفات المهام المكتملة',
                'reports.focusChartLabel': 'ساعات التركيز يوميًا',
                'reports.completedChartLabel': 'المهام المكتملة حسب الفئة',
                'settings.appearance': 'المظهر', 'settings.darkMode': 'الوضع الداكن',
                'settings.darkModeDesc': 'تفعيل الوضع الداكن للواجهة',
                'settings.language': 'اللغة', 'settings.appLanguage': 'لغة التطبيق',
                'settings.languageDesc': 'اختر لغة التطبيق',
                'settings.generalSettings': 'الإعدادات العامة',
                'settings.timer': 'التركيز والمؤقت', 'settings.pomodoroDuration': 'مدة البومودورو',
                'settings.pomodoroDesc': 'مدة جلسة التركيز',
                'settings.shortBreak': 'استراحة قصيرة', 'settings.shortBreakDesc': 'مدة الاستراحة القصيرة',
                'settings.longBreak': 'استراحة طويلة', 'settings.longBreakDesc': 'مدة الاستراحة الطويلة',
                'settings.minutes': 'د', 'settings.notifications': 'الإشعارات',
                'settings.timerNotif': 'انتهاء المؤقت', 'settings.timerNotifDesc': 'إشعار عند انتهاء المؤقت',
                'settings.taskReminder': 'تذكير المهام', 'settings.taskReminderDesc': 'تذكير بالمهام المعلقة',
                'settings.dataManagement': 'إدارة البيانات', 'settings.about': 'عن التطبيق',
                'settings.account': 'الحساب', 'settings.logout': 'تسجيل الخروج',
                'settings.logoutDesc': 'الخروج من حسابك على هذا الجهاز',
                'ai.newConversation': 'محادثة جديدة', 'ai.previousChats': 'المحادثات السابقة',
                'ai.settings': 'إعدادات AI Nuvio', 'ai.settingsSubtitle': 'خصص طريقة عمل مساعدك',
                'ai.backToApp': 'العودة إلى Nuvio',
                'ai.openChats': 'قائمة المحادثات', 'ai.clearConversation': 'مسح المحادثة',
                'ai.messagePlaceholder': 'اسأل AI Nuvio أو اطلب تنفيذ مهمة...',
                'ai.messageLabel': 'رسالة الذكاء الاصطناعي', 'ai.send': 'إرسال',
                'ai.hint': 'يتحكم في مهامك وأقسام الموقع مباشرة.',
                'ai.sidebarLabel': 'محادثات الذكاء الاصطناعي', 'ai.closeSettings': 'إغلاق الإعدادات',
                'ai.copyResponse': 'نسخ الرد', 'ai.copyFailed': 'تعذر نسخ الرد.',
                'ai.responseStyle': 'أسلوب الرد', 'ai.responseStyleHelp': 'اختر طريقة تواصل المساعد',
                'ai.toneConcise': 'مختصر ومباشر', 'ai.toneFriendly': 'ودود وشرح بسيط',
                'ai.toneDetailed': 'تفصيلي', 'ai.actions': 'تنفيذ الإجراءات',
                'ai.actionsHelp': 'السماح للمساعد بتعديل مهامك',
                'ai.preferences': 'التفضيلات', 'ai.preferencesHelp': 'اختر أسلوب الرد وصلاحيات المساعد',
                'ai.skills': 'مهارات المساعد', 'ai.skillsHelp': 'فعّل المهارات المناسبة لمحادثاتك',
                'ai.skillPlanner': 'التخطيط والتنظيم', 'ai.skillPlannerHelp': 'حوّل الأهداف إلى خطوات عملية',
                'ai.skillStudy': 'مدرب الدراسة', 'ai.skillStudyHelp': 'شرح تدريجي وأسئلة للمراجعة',
                'ai.skillWriter': 'الكتابة والتحرير', 'ai.skillWriterHelp': 'صياغة وتلخيص وتحسين النصوص',
                'ai.skillGuide': 'خبير Nuvio', 'ai.skillGuideHelp': 'مساعدة في استخدام التطبيق ومهامه',
                'ai.memory': 'ذاكرة المساعد', 'ai.memoryHelp': 'أضف ملخصًا عنك ليخصص المساعد ردوده',
                'ai.memoryHowTo': 'اطلب من ChatGPT تلخيص تفضيلاتك وأهدافك، ثم الصق الملخص هنا. تجنب كلمات المرور والبيانات شديدة الحساسية.',
                'ai.memoryPrompt': 'اكتب ملخصًا موجزًا يساعد مساعدًا شخصيًا على فهمي: تفضيلاتي في الشرح والتواصل، أهدافي، عملي أو دراستي، اهتماماتي، وطريقة تنظيم يومي. اذكر الحقائق التي شاركتها فقط، ولا تخمّن. لا تُدرج كلمات مرور أو أرقامًا مالية أو معلومات صحية شديدة الحساسية.',
                'ai.copyMemoryPrompt': 'نسخ طلب تجهيز الملخص', 'ai.memoryPromptCopied': 'تم نسخ الطلب',
                'ai.memoryPlaceholder': 'الصق ملخصك الشخصي هنا...',
                'ai.saveMemory': 'حفظ الملخص', 'ai.clearMemory': 'مسح الذاكرة',
                'ai.memorySaved': 'تم حفظ الملخص', 'ai.memoryCleared': 'تم مسح الذاكرة',
                'ai.memoryClearConfirm': 'هل تريد مسح الملخص الشخصي نهائيًا؟',
                'ai.memoryEnabled': 'سيستخدم AI الملخص في المحادثات القادمة',
                'ai.memoryDisabled': 'لن تُرسل الذاكرة إلى AI',
                'ai.useMemory': 'استخدام الذاكرة',
                'ai.useMemoryHelp': 'لن تُرسل إلى AI إلا عند تفعيل هذا الخيار',
                'ai.memoryPrivacy': 'تُحفظ الذاكرة ضمن إعداداتك وتُزامن مع حساب Nuvio. لا تضع معلومات لا تريد حفظها أو إرسالها عند تفعيل الخيار.',
                'ai.resetSettings': 'استعادة الإعدادات الافتراضية',
                'ai.welcomeTitle': 'كيف يمكنني مساعدتك؟',
                'ai.welcomeDescription': 'خطط ليومك، نظّم مهامك، أو اسأل عن أي شيء في Nuvio.',
                'ai.suggestionPlan': 'خطط يومي', 'ai.suggestionPlanHelp': 'رتّب مهام اليوم حسب الأولوية',
                'ai.suggestionAnalyze': 'حلل مهامي', 'ai.suggestionAnalyzeHelp': 'اعرض ترتيبًا واقعيًا للإنجاز',
                'ai.suggestionFocus': 'ابدأ تركيز', 'ai.suggestionFocusHelp': 'اقترح مهمة وجدول جلسة قصيرة',
                'ai.suggestionHabit': 'ابنِ عادة', 'ai.suggestionHabitHelp': 'قدّم خطة بسيطة قابلة للاستمرار',
                'ai.retry': 'إعادة المحاولة',
                'ai.networkError': 'تعذر الاتصال بالمساعد. تحقق من اتصالك وحاول مرة أخرى.',
                'ai.loginRequired': 'سجّل الدخول لاستخدام المساعد.',
                'ai.confirmTitle': 'تأكيد', 'ai.cancel': 'إلغاء', 'ai.delete': 'حذف',
                'ai.deleteConversation': 'هل تريد حذف هذه المحادثة نهائيًا؟',
                'ai.clearMessages': 'هل تريد مسح رسائل هذه المحادثة؟',
                'ai.deleteSelected': 'هل تريد حذف العنصر المحدد؟',
                'settings.personalOS': 'نظام التشغيل الشخصي',
                'modal.newTask': 'مهمة جديدة', 'modal.editTask': 'تعديل المهمة',
                'modal.taskDetails': 'تفاصيل المهمة',
                'form.taskTitle': 'عنوان المهمة *', 'form.taskTitlePlaceholder': 'أدخل عنوان المهمة',
                'form.description': 'الوصف', 'form.descPlaceholder': 'وصف تفصيلي للمهمة...',
                'form.category': 'الفئة *', 'form.priority': 'الأولوية',
                'form.dueDate': 'موعد البدء', 'form.autoStartHint': 'تبدأ تلقائيًا في الموعد وتكتمل بعد الوقت المقدر؛ يجب أن يكون التطبيق مفتوحًا.',
                'form.estimatedTime': 'الوقت المقدر (دقيقة) *',
                'form.repeat': 'التكرار', 'form.reminder': 'تذكير قبل',
                'form.tags': 'التصنيفات (مفصولة بفاصلة)', 'form.tagsPlaceholder': 'مثال: مهم، عاجل، مشروع',
                'notifications.title': 'الإشعارات',
                'status.pending': 'معلقة', 'status.inProgress': 'قيد التنفيذ', 'status.completed': 'مكتملة',
                'repeat.none': 'لا يتكرر', 'repeat.daily': 'يومي', 'repeat.weekly': 'أسبوعي', 'repeat.monthly': 'شهري',
                'reminder.atTime': 'في الموعد', 'reminder.15min': '15 دقيقة',
                                'help.title': 'كيف تستخدم Nuvio', 'help.prev': 'السابق',
                'help.next': 'التالي', 'help.finish': 'ابدأ الاستخدام',
                'help.welcomeTitle': 'مرحباً بك في Nuvio',
                'help.welcomeDesc': 'نظام التشغيل الشخصي اللي هيساعدك ترتب يومك وتحقق أهدافك',
                'help.tasksTitle': 'المهام',
                'help.tasksDesc': 'أضف مهامك ورتبها حسب الأولوية والفئة. تقدر تحدد موعد نهاية وتذكير لكل مهمة',
                'help.focusTitle': 'جلسات التركيز',
                'help.focusDesc': 'استخدم تقنية البومودورو عشان تركز أكتر. جلسة تركيز 25 دقيقة واستراحة 5 دقايق',
                'help.habitsTitle': 'العادات اليومية',
                'help.habitsDesc': 'تابع عاداتك اليومية زي القراءة والرياضة والصلاة. كل يوم تضغط check لما تعمل العادة',
                'help.prayerTitle': 'مواقيت الصلاة',
                'help.prayerDesc': 'اعرف مواقيت الصلاة في مدينتك مع عد تنازلي للصلاة القادمة والتاريخ الهجري',
                'help.reportsTitle': 'التقارير',
                'help.reportsDesc': 'تابع تقدمك أسبوعياً وشهرياً. شوف إحصائيات المهام المكتملة وساعات التركيز',
                'help.settingsTitle': 'إعداداتك',
                'help.settingsDesc': 'غير اللغة والمظهر ومدة البومودورو والإشعارات حسب ما يناسبك',
                'help.readyTitle': 'جاهز تبدأ؟',
                'help.readyDesc': 'ابدأ بإضافة أول مهمة أو عادة وخلّي Nuvio يساعدك توصل لأهدافك',
                'help.skip': 'تخطي', 'help.feature1': 'إدارة المهام الذكية',
                'help.feature2': 'جلسات تركيز بومودورو', 'help.feature3': 'تتبع العادات اليومية',
                'help.feature4': 'مواقيت الصلاة', 'help.feature5': 'تقارير وإحصائيات',
                'help.feature6': 'تصدير واستيراد البيانات',
                                'nav.notes': 'المذكرات',
                'notes.newNote': 'مذكرة جديدة', 'notes.title': 'العنوان',
                'notes.titlePlaceholder': 'عنوان المذكرة',
                'notes.content': 'المحتوى', 'notes.contentPlaceholder': 'اكتب مذكرتك هنا...',
                'notes.tags': 'التصنيفات (مفصولة بفاصلة)',
                'notes.tagsPlaceholder': 'مثال: أفكار، مشروع، يوميات',
                'notes.color': 'لون المذكرة', 'notes.searchPlaceholder': 'ابحث في مذكراتك...',
                'notes.noNotes': 'لا توجد مذكرات', 'notes.createFirst': 'اكتب أول مذكرة',
                'notes.editNote': 'تعديل المذكرة', 'notes.deleteConfirm': 'هل أنت متأكد من حذف هذه المذكرة؟',
                'notes.saved': 'تم حفظ المذكرة', 'notes.updated': 'تم تحديث المذكرة',
                'notes.deleted': 'تم حذف المذكرة', 'actions.save': 'حفظ',
                'reminder.30min': '30 دقيقة', 'reminder.1hour': 'ساعة', 'reminder.1day': 'يوم',
                                'welcome.subtitle': 'نظام التشغيل الشخصي',
                'welcome.choosePhoto': 'اختر صورة',
                'welcome.yourName': 'اسمك',
                'welcome.namePlaceholder': 'اكتب اسمك هنا',
                'welcome.start': 'ابدأ',
                                'welcome.editTitle': 'تعديل بروفايلك',
                                'help.title': 'كيف تستخدم Nuvio', 'help.prev': 'السابق',
                                                'nav.sleep': 'تتبع النوم', 'nav.water': 'شرب الماء',
                'sleep.title': 'تتبع النوم', 'sleep.addRecord': 'تسجيل نوم',
                'sleep.avgHours': 'متوسط النوم', 'sleep.avgQuality': 'جودة النوم',
                'sleep.totalNights': 'ليالي مسجلة', 'sleep.weeklyChart': 'نوم الأسبوع',
                'sleep.noRecords': 'لا توجد سجلات', 'sleep.createFirst': 'سجل أول ليلة نوم',
                'sleep.bedTime': 'وقت النوم', 'sleep.wakeTime': 'وقت الاستيقاظ',
                'sleep.quality': 'جودة النوم', 'sleep.poor': 'سيء',
                'sleep.fair': 'مقبول', 'sleep.good': 'جيد',
                'sleep.excellent': 'ممتاز', 'sleep.notes': 'ملاحظات (اختياري)',
                'sleep.notesPlaceholder': 'مثال: استيقظت مرة...',
                'sleep.hours': 'ساعة', 'sleep.deleteConfirm': 'هل أنت متأكد من حذف هذا السجل؟',
                'sleep.saved': 'تم تسجيل النوم', 'sleep.deleted': 'تم حذف السجل',
                'water.title': 'تتبع شرب الماء', 'water.dailyGoal': 'الهدف اليومي:',
                'water.glasses': 'كوب', 'water.addGlass': 'كوب',
                'water.reminder': 'تذكير كل ساعة',
                'water.congrats': 'أحسنت! حققت هدفك اليومي',
                'help.next': 'التالي', 'help.finish': 'ابدأ الاستخدام',
                'help.welcomeTitle': 'مرحباً بك في Nuvio',
                'help.welcomeDesc': 'نظام التشغيل الشخصي اللي هيساعدك ترتب يومك وتحقق أهدافك',
                'help.tasksTitle': 'المهام',
                'help.tasksDesc': 'أضف مهامك ورتبها حسب الأولوية والفئة. تقدر تحدد موعد نهاية وتذكير لكل مهمة',
                'help.focusTitle': 'جلسات التركيز',
                'help.focusDesc': 'استخدم تقنية البومودورو عشان تركز أكتر. جلسة تركيز 25 دقيقة واستراحة 5 دقايق',
                'help.habitsTitle': 'العادات اليومية',
                'help.habitsDesc': 'تابع عاداتك اليومية زي القراءة والرياضة والصلاة. كل يوم تضغط check لما تعمل العادة',
                'help.prayerTitle': 'مواقيت الصلاة',
                'help.prayerDesc': 'اعرف مواقيت الصلاة في مدينتك مع عد تنازلي للصلاة القادمة والتاريخ الهجري',
                'help.reportsTitle': 'التقارير',
                'help.reportsDesc': 'تابع تقدمك أسبوعياً وشهرياً. شوف إحصائيات المهام المكتملة وساعات التركيز',
                'help.settingsTitle': 'إعداداتك',
                'help.settingsDesc': 'غير اللغة والمظهر ومدة البومودورو والإشعارات حسب ما يناسبك',
                'help.readyTitle': 'جاهز تبدأ؟',
                'help.readyDesc': 'ابدأ بإضافة أول مهمة أو عادة وخلّي Nuvio يساعدك توصل لأهدافك',
                'help.feature1': 'إدارة المهام الذكية',
                'help.feature2': 'جلسات تركيز بومودورو',
                'help.feature3': 'تتبع العادات اليومية',
                'help.feature4': 'مواقيت الصلاة',
                'help.feature5': 'تقارير وإحصائيات',
                'help.feature7': 'المذكرات والملاحظات',
                'help.feature8': 'تتبع النوم',
                'help.feature9': 'تتبع شرب الماء',
                'help.notesTitle': 'المذكرات',
                'help.notesDesc': 'اكتب ملاحظاتك وأفكارك ورتبها بالتصنيفات. تقدر تبحث فيها في أي وقت',
                'help.sleepTitle': 'تتبع النوم',
                'help.sleepDesc': 'سجل وقت نومك واستيقاظك وجودة نومك. تابع متوسط نومك الأسبوعي',
                'help.waterTitle': 'تتبع شرب الماء',
                'help.waterDesc': 'اضغط كل مرة تشرب كوب مياه وهنحسبلك هدفك اليومي. في تذكير كل ساعة كمان',
                'nav.habits': 'العادات اليومية', 'nav.prayer': 'مواقيت الصلاة',
                'habits.newHabit': 'عادة جديدة', 'habits.habitTitle': 'اسم العادة *',
                'habits.habitTitlePlaceholder': 'مثال: قراءة 10 صفحات',
                'habits.description': 'الوصف', 'habits.descPlaceholder': 'وصف مختصر...',
                'habits.icon': 'الأيقونة', 'habits.color': 'اللون',
                'habits.target': 'الهدف اليومي', 'habits.unit': 'الوحدة',
                'habits.unitPlaceholder': 'مرة / صفحة / دقيقة',
                'habits.reminderTime': 'تذكير يومي (اختياري)',
                'habits.repeatDays': 'أيام التكرار',
                'habits.currentStreak': 'أطول سلسلة', 'habits.completedToday': 'منجزة اليوم',
                'habits.successRate': 'نسبة النجاح', 'habits.noHabits': 'لا توجد عادات',
                'habits.createFirst': 'أنشئ أول عادة للبدء',
                'habits.weeklyOverview': 'نظرة أسبوعية',
                'habits.editHabit': 'تعديل العادة',
                'habits.deleteConfirm': 'هل أنت متأكد من حذف هذه العادة؟',
                'habits.deleted': 'تم حذف العادة',
                'habits.saved': 'تم حفظ العادة',
                'habits.updated': 'تم تحديث العادة',
                'habits.checkDone': 'تم إنجاز العادة',
                'habits.uncheckDone': 'تم إلغاء الإنجاز',
                'days.sunShort': 'ح', 'days.monShort': 'ن', 'days.tueShort': 'ث',
                'days.wedShort': 'ر', 'days.thuShort': 'خ', 'days.friShort': 'ج', 'days.satShort': 'س',
                'prayer.location': 'الموقع', 'prayer.selectCity': 'اختر المدينة',
                'prayer.calcMethod': 'طريقة الحساب', 'prayer.useLocation': 'استخدام موقعي',
                'prayer.nextPrayer': 'الصلاة القادمة', 'prayer.fajr': 'الفجر',
                'prayer.sunrise': 'الشروق', 'prayer.dhuhr': 'الظهر',
                'prayer.asr': 'العصر', 'prayer.maghrib': 'المغرب',
                'prayer.isha': 'العشاء', 'prayer.timeUntil': 'متبقي',
                'prayer.loading': 'جاري تحميل المواقيت...',
                'prayer.error': 'تعذر تحميل المواقيت',
                'prayer.locationError': 'تعذر تحديد الموقع',
                'actions.save': 'حفظ'
            },
            en: {
                'nav.dashboard': 'Dashboard', 'nav.tasks': 'Tasks', 'nav.focus': 'Focus',
                'nav.calendar': 'Calendar', 'nav.reports': 'Reports', 'nav.settings': 'Settings',
                'user.name': 'User', 'user.role': 'Personal Operating System',
                'pages.dashboard': 'Dashboard', 'pages.tasks': 'Tasks', 'pages.focus': 'Focus',
                'pages.calendar': 'Calendar', 'pages.reports': 'Reports', 'pages.settings': 'Settings',
                'actions.newTask': 'New Task', 'actions.selectTask': 'Select Task',
                'actions.focusSession': 'Focus Session', 'actions.report': 'Report',
                'actions.export': 'Export', 'actions.viewAll': 'View All',
                'actions.cancel': 'Cancel', 'actions.saveTask': 'Save Task',
                'actions.exportData': 'Export Data', 'actions.importData': 'Import Data',
                'actions.clearAll': 'Clear All Data',
                'dashboard.welcome': 'Welcome Back', 'dashboard.todayProgress': "Today's Progress",
                'dashboard.completed': 'Completed', 'dashboard.completedLabel': 'Done',
                'dashboard.totalLabel': 'Total', 'dashboard.pendingLabel': 'Pending',
                'dashboard.currentTask': 'Current Task', 'dashboard.noActiveTask': 'No active task',
                'dashboard.quickActions': 'Quick Actions', 'dashboard.todayStats': "Today's Stats",
                'dashboard.tasksCompleted': 'Tasks Done', 'dashboard.focusTime': 'Focus Time',
                'dashboard.focusTimer': 'Focus Timer', 'dashboard.motivation': 'Daily Motivation',
                'dashboard.productivity': 'Productivity', 'dashboard.focusSummary': 'Focus Summary',
                'dashboard.onTrack': 'On Track', 'dashboard.sessions': 'Sessions',
                'dashboard.totalTime': 'Total Time', 'dashboard.weeklyReport': 'Weekly Report',
                'dashboard.focusHours': 'Focus Hours', 'dashboard.completedTasks': 'Completed Tasks',
                'filters.all': 'All', 'filters.pending': 'Pending', 'filters.inProgress': 'In Progress',
                'filters.completed': 'Completed', 'filters.overdue': 'Overdue',
                'sort.newest': 'Newest', 'sort.priority': 'Priority',
                'sort.dueDate': 'Due Date', 'sort.estimatedTime': 'Estimated Time',
                'tasks.noTasks': 'No Tasks', 'tasks.createFirst': 'Create your first task to get started',
                'timer.pomodoro': 'Pomodoro', 'timer.shortBreak': 'Short Break',
                'timer.longBreak': 'Long Break', 'timer.start': 'Start',
                'timer.pause': 'Pause', 'timer.reset': 'Reset',
                'timer.noTaskSelected': 'No task selected',
                'focus.sessionStats': 'Session Stats', 'focus.sessions': 'Sessions',
                'focus.focus': 'Focus', 'focus.break': 'Break',
                'focus.productivityGrade': 'Productivity Grade', 'focus.excellent': 'Excellent',
                'days.sun': 'Sun', 'days.mon': 'Mon', 'days.tue': 'Tue',
                'days.wed': 'Wed', 'days.thu': 'Thu', 'days.fri': 'Fri', 'days.sat': 'Sat',
                'calendar.todayTasks': "Today's Tasks",
                'reports.focusHours': 'Focus Hours', 'reports.completedTasks': 'Completed Tasks',
                'reports.activityMap': 'Activity Map', 'reports.monthlyOverview': 'Monthly Overview',
                'reports.thisWeek': 'This Week', 'reports.thisMonth': 'This Month',
                'reports.totalTasks': 'Tasks created', 'reports.completed': 'Completed',
                'reports.focusHoursLabel': 'Focus Hours', 'reports.avgProductivity': 'Completion rate',
                'reports.periodOverview': 'Period summary', 'reports.last7Days': 'Last 7 days',
                'reports.last30Days': 'Last 30 days',
                'reports.periodSelector': 'Report period', 'reports.completedLegend': 'Completed task categories',
                'reports.focusChartLabel': 'Daily focus hours',
                'reports.completedChartLabel': 'Completed tasks by category',
                'settings.appearance': 'Appearance', 'settings.darkMode': 'Dark Mode',
                'settings.darkModeDesc': 'Enable dark mode for the interface',
                'settings.language': 'Language', 'settings.appLanguage': 'App Language',
                'settings.languageDesc': 'Choose your preferred language',
                'settings.generalSettings': 'General Settings',
                'settings.timer': 'Focus & Timer', 'settings.pomodoroDuration': 'Pomodoro Duration',
                'settings.pomodoroDesc': 'Focus session duration',
                'settings.shortBreak': 'Short Break', 'settings.shortBreakDesc': 'Short break duration',
                'settings.longBreak': 'Long Break', 'settings.longBreakDesc': 'Long break duration',
                'settings.minutes': 'min', 'settings.notifications': 'Notifications',
                'settings.timerNotif': 'Timer End', 'settings.timerNotifDesc': 'Notify when timer ends',
                'settings.taskReminder': 'Task Reminders', 'settings.taskReminderDesc': 'Remind about pending tasks',
                'settings.dataManagement': 'Data Management', 'settings.about': 'About',
                'settings.account': 'Account', 'settings.logout': 'Sign Out',
                'settings.logoutDesc': 'Sign out of your account on this device',
                'ai.newConversation': 'New chat', 'ai.previousChats': 'Recent chats',
                'ai.settings': 'AI Nuvio settings', 'ai.settingsSubtitle': 'Customize how your assistant works',
                'ai.backToApp': 'Back to Nuvio',
                'ai.openChats': 'Open conversations', 'ai.clearConversation': 'Clear conversation',
                'ai.messagePlaceholder': 'Ask AI Nuvio or request a task...',
                'ai.messageLabel': 'AI assistant message', 'ai.send': 'Send',
                'ai.hint': 'Manage your tasks and navigate the app directly.',
                'ai.sidebarLabel': 'AI conversations', 'ai.closeSettings': 'Close settings',
                'ai.copyResponse': 'Copy response', 'ai.copyFailed': 'Could not copy the response.',
                'ai.responseStyle': 'Response style', 'ai.responseStyleHelp': 'Choose how the assistant communicates',
                'ai.toneConcise': 'Concise and direct', 'ai.toneFriendly': 'Friendly with simple explanations',
                'ai.toneDetailed': 'Detailed', 'ai.actions': 'Perform actions',
                'ai.actionsHelp': 'Allow the assistant to update your tasks',
                'ai.preferences': 'Preferences', 'ai.preferencesHelp': 'Choose the response style and permissions',
                'ai.skills': 'Assistant skills', 'ai.skillsHelp': 'Enable skills for your conversations',
                'ai.skillPlanner': 'Planning and organization', 'ai.skillPlannerHelp': 'Turn goals into practical steps',
                'ai.skillStudy': 'Study coach', 'ai.skillStudyHelp': 'Step-by-step explanations and review questions',
                'ai.skillWriter': 'Writing and editing', 'ai.skillWriterHelp': 'Draft, summarize, and refine text',
                'ai.skillGuide': 'Nuvio guide', 'ai.skillGuideHelp': 'Help using the app and its tasks',
                'ai.memory': 'Assistant memory', 'ai.memoryHelp': 'Add a profile to personalize responses',
                'ai.memoryHowTo': 'Ask ChatGPT to summarize your preferences and goals, then paste the summary here. Avoid passwords and highly sensitive details.',
                'ai.memoryPrompt': 'Write a concise profile to help a personal assistant understand me: my communication and explanation preferences, goals, work or study, interests, and how I organize my day. Include only facts I shared; do not guess. Do not include passwords, financial numbers, or highly sensitive health information.',
                'ai.copyMemoryPrompt': 'Copy profile prompt', 'ai.memoryPromptCopied': 'Prompt copied',
                'ai.memoryPlaceholder': 'Paste your personal summary here...',
                'ai.saveMemory': 'Save summary', 'ai.clearMemory': 'Clear memory',
                'ai.memorySaved': 'Summary saved', 'ai.memoryCleared': 'Memory cleared',
                'ai.memoryClearConfirm': 'Permanently clear your personal summary?',
                'ai.memoryEnabled': 'AI will use this summary in future chats',
                'ai.memoryDisabled': 'Memory will not be sent to AI',
                'ai.useMemory': 'Use personal memory',
                'ai.useMemoryHelp': 'Only sent to AI when this option is enabled',
                'ai.memoryPrivacy': 'Memory is saved in your settings and synced with your Nuvio account. Do not add information you do not want stored or sent when enabled.',
                'ai.resetSettings': 'Restore default settings',
                'ai.welcomeTitle': 'How can I help you?',
                'ai.welcomeDescription': 'Plan your day, organize your tasks, or ask anything about Nuvio.',
                'ai.suggestionPlan': 'Plan my day', 'ai.suggestionPlanHelp': 'Prioritize today’s tasks',
                'ai.suggestionAnalyze': 'Review my tasks', 'ai.suggestionAnalyzeHelp': 'Suggest a realistic order',
                'ai.suggestionFocus': 'Start focusing', 'ai.suggestionFocusHelp': 'Choose a task and plan a short session',
                'ai.suggestionHabit': 'Build a habit', 'ai.suggestionHabitHelp': 'Create a simple, sustainable plan',
                'ai.retry': 'Try again',
                'ai.networkError': 'Could not reach the assistant. Check your connection and try again.',
                'ai.loginRequired': 'Sign in to use the assistant.',
                'ai.confirmTitle': 'Confirm', 'ai.cancel': 'Cancel', 'ai.delete': 'Delete',
                'ai.deleteConversation': 'Delete this conversation permanently?',
                'ai.clearMessages': 'Clear the messages in this conversation?',
                'ai.deleteSelected': 'Delete the selected item?',
                'settings.personalOS': 'Personal Operating System',
                'modal.newTask': 'New Task', 'modal.editTask': 'Edit Task',
                'modal.taskDetails': 'Task Details',
                'form.taskTitle': 'Task Title *', 'form.taskTitlePlaceholder': 'Enter task title',
                'form.description': 'Description', 'form.descPlaceholder': 'Detailed description of the task...',
                'form.category': 'Category *', 'form.priority': 'Priority',
                'form.dueDate': 'Start Time', 'form.autoStartHint': 'Starts at the scheduled time and completes after the estimated duration; keep the app open.',
                'form.estimatedTime': 'Estimated Time (minutes) *',
                'form.repeat': 'Repeat', 'form.reminder': 'Remind Before',
                'form.tags': 'Tags (comma separated)', 'form.tagsPlaceholder': 'e.g. important, urgent, project',
                'notifications.title': 'Notifications',
                'status.pending': 'Pending', 'status.inProgress': 'In Progress', 'status.completed': 'Completed',
                'repeat.none': 'Does not repeat', 'repeat.daily': 'Daily', 'repeat.weekly': 'Weekly', 'repeat.monthly': 'Monthly',
                'reminder.atTime': 'At time', 'reminder.15min': '15 minutes',
                                'help.title': 'How to Use Nuvio', 'help.prev': 'Previous',
                'help.next': 'Next', 'help.finish': 'Start Using',
                'help.welcomeTitle': 'Welcome to Nuvio',
                'help.welcomeDesc': 'Your personal operating system to organize your day and achieve your goals',
                'help.tasksTitle': 'Tasks',
                'help.tasksDesc': 'Add your tasks and organize them by priority and category. Set due dates and reminders',
                'help.focusTitle': 'Focus Sessions',
                'help.focusDesc': 'Use the Pomodoro technique to focus better. 25 min focus + 5 min break',
                'help.habitsTitle': 'Daily Habits',
                'help.habitsDesc': 'Track daily habits like reading, exercise, and prayer. Check them off each day',
                'help.prayerTitle': 'Prayer Times',
                'help.prayerDesc': 'Know prayer times in your city with countdown to next prayer and Hijri date',
                'help.reportsTitle': 'Reports',
                                'nav.sleep': 'Sleep Tracker', 'nav.water': 'Water Tracker',
                'sleep.title': 'Sleep Tracker', 'sleep.addRecord': 'Add Sleep',
                'sleep.avgHours': 'Avg Sleep', 'sleep.avgQuality': 'Sleep Quality',
                'sleep.totalNights': 'Nights Logged', 'sleep.weeklyChart': 'Weekly Sleep',
                'sleep.noRecords': 'No Records', 'sleep.createFirst': 'Log your first night',
                'sleep.bedTime': 'Bedtime', 'sleep.wakeTime': 'Wake Time',
                'sleep.quality': 'Sleep Quality', 'sleep.poor': 'Poor',
                'sleep.fair': 'Fair', 'sleep.good': 'Good',
                'sleep.excellent': 'Excellent', 'sleep.notes': 'Notes (optional)',
                'sleep.notesPlaceholder': 'e.g. woke up once...',
                'sleep.hours': 'hours', 'sleep.deleteConfirm': 'Delete this sleep record?',
                'sleep.saved': 'Sleep logged', 'sleep.deleted': 'Record deleted',
                'water.title': 'Water Tracker', 'water.dailyGoal': 'Daily Goal:',
                'water.glasses': 'glasses', 'water.addGlass': 'Glass',
                'water.reminder': 'Hourly Reminder',
                'water.congrats': 'Great! You reached your daily goal',
                'help.reportsDesc': 'Track your weekly and monthly progress. See completed tasks and focus hours',
                'help.settingsTitle': 'Your Settings',
                'help.settingsDesc': 'Change language, theme, Pomodoro duration, and notifications to suit you',
                'help.readyTitle': 'Ready to Start?',
                'help.readyDesc': 'Add your first task or habit and let Nuvio help you reach your goals',
                'help.skip': 'Skip', 'help.feature1': 'Smart Task Management',
                'help.feature2': 'Pomodoro Focus Sessions', 'help.feature3': 'Daily Habit Tracking',
                'help.feature4': 'Prayer Times', 'help.feature5': 'Reports & Analytics',
                'help.feature6': 'Export & Import Data',
                'reminder.30min': '30 minutes', 'reminder.1hour': '1 hour', 'reminder.1day': '1 day',
                                'welcome.subtitle': 'Personal Operating System',
                'welcome.choosePhoto': 'Choose Photo',
                'welcome.yourName': 'Your Name',
                'welcome.namePlaceholder': 'Enter your name',
                'welcome.start': 'Start',
                                'welcome.editTitle': 'Edit Your Profile',
                                'help.title': 'How to Use Nuvio', 'help.prev': 'Previous',
                'help.next': 'Next', 'help.finish': 'Start Using',
                'help.welcomeTitle': 'Welcome to Nuvio',
                'help.welcomeDesc': 'Your personal operating system to organize your day and achieve your goals',
                'help.tasksTitle': 'Tasks',
                'help.tasksDesc': 'Add your tasks and organize them by priority and category. Set due dates and reminders',
                'help.focusTitle': 'Focus Sessions',
                'help.focusDesc': 'Use the Pomodoro technique to focus better. 25 min focus + 5 min break',
                'help.habitsTitle': 'Daily Habits',
                'help.habitsDesc': 'Track daily habits like reading, exercise, and prayer. Check them off each day',
                'help.prayerTitle': 'Prayer Times',
                'help.prayerDesc': 'Know prayer times in your city with countdown to next prayer and Hijri date',
                'help.reportsTitle': 'Reports',
                'help.reportsDesc': 'Track your weekly and monthly progress. See completed tasks and focus hours',
                'help.settingsTitle': 'Your Settings',
                'help.settingsDesc': 'Change language, theme, Pomodoro duration, and notifications to suit you',
                'help.readyTitle': 'Ready to Start?',
                'help.readyDesc': 'Add your first task or habit and let Nuvio help you reach your goals',
                'help.feature1': 'Smart Task Management',
                'help.feature2': 'Pomodoro Focus Sessions',
                'help.feature3': 'Daily Habit Tracking',
                'help.feature4': 'Prayer Times',
                'help.feature5': 'Reports & Analytics',
                'help.feature7': 'Notes & Memos',
                'help.feature8': 'Sleep Tracker',
                'help.feature9': 'Water Tracker',
                'help.notesTitle': 'Notes',
                'help.notesDesc': 'Write your notes and ideas and organize them with tags. Search them anytime',
                'help.sleepTitle': 'Sleep Tracker',
                'help.sleepDesc': 'Log your bedtime, wake time and sleep quality. Track your weekly sleep average',
                'help.waterTitle': 'Water Tracker',
                'help.waterDesc': 'Tap every time you drink a glass of water and we will track your daily goal. Hourly reminder too',
                                'nav.notes': 'Notes',
                'notes.newNote': 'New Note', 'notes.title': 'Title',
                'notes.titlePlaceholder': 'Note title',
                'notes.content': 'Content', 'notes.contentPlaceholder': 'Write your note here...',
                'notes.tags': 'Tags (comma separated)',
                'notes.tagsPlaceholder': 'e.g. ideas, project, diary',
                'notes.color': 'Note Color', 'notes.searchPlaceholder': 'Search your notes...',
                'notes.noNotes': 'No Notes', 'notes.createFirst': 'Write your first note',
                'notes.editNote': 'Edit Note', 'notes.deleteConfirm': 'Are you sure you want to delete this note?',
                'notes.saved': 'Note saved', 'notes.updated': 'Note updated',
                'notes.deleted': 'Note deleted', 'actions.save': 'Save',
                'nav.habits': 'Daily Habits', 'nav.prayer': 'Prayer Times',
                'habits.newHabit': 'New Habit', 'habits.habitTitle': 'Habit Name *',
                'habits.habitTitlePlaceholder': 'e.g. Read 10 pages',
                'habits.description': 'Description', 'habits.descPlaceholder': 'Short description...',
                'habits.icon': 'Icon', 'habits.color': 'Color',
                'habits.target': 'Daily Target', 'habits.unit': 'Unit',
                'habits.unitPlaceholder': 'time / page / minute',
                'habits.reminderTime': 'Daily Reminder (optional)',
                'habits.repeatDays': 'Repeat Days',
                'habits.currentStreak': 'Best Streak', 'habits.completedToday': 'Done Today',
                'habits.successRate': 'Success Rate', 'habits.noHabits': 'No Habits',
                'habits.createFirst': 'Create your first habit to get started',
                'habits.weeklyOverview': 'Weekly Overview',
                'habits.editHabit': 'Edit Habit',
                'habits.deleteConfirm': 'Are you sure you want to delete this habit?',
                'habits.deleted': 'Habit deleted',
                'habits.saved': 'Habit saved',
                'habits.updated': 'Habit updated',
                'habits.checkDone': 'Habit completed',
                'habits.uncheckDone': 'Completion cancelled',
                'days.sunShort': 'S', 'days.monShort': 'M', 'days.tueShort': 'T',
                'days.wedShort': 'W', 'days.thuShort': 'T', 'days.friShort': 'F', 'days.satShort': 'S',
                'prayer.location': 'Location', 'prayer.selectCity': 'Select City',
                'prayer.calcMethod': 'Calculation Method', 'prayer.useLocation': 'Use My Location',
                'prayer.nextPrayer': 'Next Prayer', 'prayer.fajr': 'Fajr',
                'prayer.sunrise': 'Sunrise', 'prayer.dhuhr': 'Dhuhr',
                'prayer.asr': 'Asr', 'prayer.maghrib': 'Maghrib',
                'prayer.isha': 'Isha', 'prayer.timeUntil': 'Time remaining',
                'prayer.loading': 'Loading prayer times...',
                'prayer.error': 'Failed to load prayer times',
                'prayer.locationError': 'Could not determine location',
                'actions.save': 'Save'
            }
        };
        return translations[lang]?.[key] || translations['en']?.[key] || key;
    },

    applyLanguage() {
        const lang = this.settings.language;
        const isRTL = lang === 'ar';

        document.documentElement.lang = lang;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        const aiSection = document.getElementById('aiSection');
        if (aiSection) aiSection.dir = isRTL ? 'rtl' : 'ltr';

        // Update all translated elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation) el.textContent = translation;
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation) el.placeholder = translation;
        });
        document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria-label');
            const translation = this.t(key);
            if (translation) el.setAttribute('aria-label', translation);
        });
        // Update user name in sidebar
        const sidebarName = document.getElementById('sidebarUserName');
        if (sidebarName && this.userProfile.name) {
            sidebarName.textContent = this.userProfile.name;
        }
        // Update page title
        const titles = {
            dashboard: this.t('pages.dashboard'),
            tasks: this.t('pages.tasks'),
            focus: this.t('pages.focus'),
            calendar: this.t('pages.calendar'),
            reports: this.t('pages.reports'),
            settings: this.t('pages.settings'),
            habits: this.t('nav.habits'),
            prayer: this.t('nav.prayer'),
            sleep: this.t('nav.sleep'),
            water: this.t('nav.water'),
            notes: this.t('nav.notes')
        };
        document.getElementById('pageTitle').textContent = titles[this.currentSection] || 'Nuvio';

        // Update lang toggle button
        const langBtn = document.getElementById('langToggle');
        if (langBtn) langBtn.innerHTML = `<span>${lang === 'ar' ? 'EN' : 'AR'}</span>`;

        // Update language select
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) langSelect.value = lang;

        // Update sidebar position
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebar && mainContent) {
            if (isRTL) {
                sidebar.style.right = '0';
                sidebar.style.left = 'auto';
                mainContent.style.marginRight = '260px';
                mainContent.style.marginLeft = '0';
            } else {
                sidebar.style.left = '0';
                sidebar.style.right = 'auto';
                mainContent.style.marginLeft = '260px';
                mainContent.style.marginRight = '0';
            }
        }

        // Update modal direction
        const modals = document.querySelectorAll('.modal-slide');
        modals.forEach(m => {
            if (isRTL) {
                m.style.right = '0';
                m.style.left = 'auto';
                m.style.transform = m.classList.contains('active') ? 'translateX(0)' : 'translateX(100%)';
                m.style.borderLeft = '1px solid var(--border-color)';
                m.style.borderRight = 'none';
            } else {
                m.style.left = '0';
                m.style.right = 'auto';
                m.style.transform = m.classList.contains('active') ? 'translateX(0)' : 'translateX(-100%)';
                m.style.borderRight = '1px solid var(--border-color)';
                m.style.borderLeft = 'none';
            }
        });

        this.populateFormOptions();
        this.renderAll();
        this.updateAccountSettings(this.accountSession);
        window.NuvioAuth?.applyLanguage?.();
        window.NuvioAI?.refreshLanguage?.();
    },

    toggleLanguage() {
        this.settings.language = this.settings.language === 'ar' ? 'en' : 'ar';
        this.applyLanguage();
        this.saveData();
        this.showToast(this.settings.language === 'ar' ? 'تم تغيير اللغة' : 'Language changed', 'success');
    },

    changeLanguage() {
        this.settings.language = document.getElementById('languageSelect').value;
        this.applyLanguage();
        this.saveData();
    },

    populateFormOptions() {
        const lang = this.settings.language;

        const catSelect = document.getElementById('taskCategory');
        if (catSelect) {
            catSelect.innerHTML = Object.entries(this.categories).map(([key, cat]) => 
                `<option value="${key}">${cat.icon} ${lang === 'ar' ? cat.nameAr : cat.nameEn}</option>`
            ).join('');
        }

        const priSelect = document.getElementById('taskPriority');
        if (priSelect) {
            priSelect.innerHTML = Object.entries(this.priorities).map(([key, pri]) => 
                `<option value="${key}">${lang === 'ar' ? pri.nameAr : pri.nameEn}</option>`
            ).join('');
        }

        const repSelect = document.getElementById('taskRepeat');
        if (repSelect) {
            repSelect.innerHTML = `
                <option value="none">${this.t('repeat.none')}</option>
                <option value="daily">${this.t('repeat.daily')}</option>
                <option value="weekly">${this.t('repeat.weekly')}</option>
                <option value="monthly">${this.t('repeat.monthly')}</option>
            `;
        }

        const remSelect = document.getElementById('taskReminderSelect');
        if (remSelect) {
            remSelect.innerHTML = `
                <option value="0">${this.t('reminder.atTime')}</option>
                <option value="15">${this.t('reminder.15min')}</option>
                <option value="30">${this.t('reminder.30min')}</option>
                <option value="60">${this.t('reminder.1hour')}</option>
                <option value="1440">${this.t('reminder.1day')}</option>
            `;
        }
    },
});
