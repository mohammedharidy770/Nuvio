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
                'reports.totalTasks': 'إجمالي المهام', 'reports.completed': 'مكتملة',
                'reports.focusHoursLabel': 'ساعات تركيز', 'reports.avgProductivity': 'متوسط الإنتاجية',
                'settings.appearance': 'المظهر', 'settings.darkMode': 'الوضع الداكن',
                'settings.darkModeDesc': 'تفعيل الوضع الداكن للواجهة',
                'settings.language': 'اللغة', 'settings.appLanguage': 'لغة التطبيق',
                'settings.languageDesc': 'اختر لغة التطبيق',
                'settings.timer': 'إعدادات المؤقت', 'settings.pomodoroDuration': 'مدة البومودورو',
                'settings.pomodoroDesc': 'مدة جلسة التركيز',
                'settings.shortBreak': 'استراحة قصيرة', 'settings.shortBreakDesc': 'مدة الاستراحة القصيرة',
                'settings.longBreak': 'استراحة طويلة', 'settings.longBreakDesc': 'مدة الاستراحة الطويلة',
                'settings.minutes': 'د', 'settings.notifications': 'الإشعارات',
                'settings.timerNotif': 'انتهاء المؤقت', 'settings.timerNotifDesc': 'إشعار عند انتهاء المؤقت',
                'settings.taskReminder': 'تذكير المهام', 'settings.taskReminderDesc': 'تذكير بالمهام المعلقة',
                'settings.dataManagement': 'إدارة البيانات', 'settings.about': 'عن التطبيق',
                'settings.account': 'الحساب', 'settings.logout': 'تسجيل الخروج',
                'settings.logoutDesc': 'الخروج من حسابك على هذا الجهاز',
                'settings.personalOS': 'نظام التشغيل الشخصي',
                'modal.newTask': 'مهمة جديدة', 'modal.editTask': 'تعديل المهمة',
                'modal.taskDetails': 'تفاصيل المهمة',
                'form.taskTitle': 'عنوان المهمة *', 'form.taskTitlePlaceholder': 'أدخل عنوان المهمة',
                'form.description': 'الوصف', 'form.descPlaceholder': 'وصف تفصيلي للمهمة...',
                'form.category': 'الفئة *', 'form.priority': 'الأولوية',
                'form.dueDate': 'موعد النهاية', 'form.estimatedTime': 'الوقت المقدر (دقيقة) *',
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
                'reports.totalTasks': 'Total Tasks', 'reports.completed': 'Completed',
                'reports.focusHoursLabel': 'Focus Hours', 'reports.avgProductivity': 'Avg Productivity',
                'settings.appearance': 'Appearance', 'settings.darkMode': 'Dark Mode',
                'settings.darkModeDesc': 'Enable dark mode for the interface',
                'settings.language': 'Language', 'settings.appLanguage': 'App Language',
                'settings.languageDesc': 'Choose your preferred language',
                'settings.timer': 'Timer Settings', 'settings.pomodoroDuration': 'Pomodoro Duration',
                'settings.pomodoroDesc': 'Focus session duration',
                'settings.shortBreak': 'Short Break', 'settings.shortBreakDesc': 'Short break duration',
                'settings.longBreak': 'Long Break', 'settings.longBreakDesc': 'Long break duration',
                'settings.minutes': 'min', 'settings.notifications': 'Notifications',
                'settings.timerNotif': 'Timer End', 'settings.timerNotifDesc': 'Notify when timer ends',
                'settings.taskReminder': 'Task Reminders', 'settings.taskReminderDesc': 'Remind about pending tasks',
                'settings.dataManagement': 'Data Management', 'settings.about': 'About',
                'settings.account': 'Account', 'settings.logout': 'Sign Out',
                'settings.logoutDesc': 'Sign out of your account on this device',
                'settings.personalOS': 'Personal Operating System',
                'modal.newTask': 'New Task', 'modal.editTask': 'Edit Task',
                'modal.taskDetails': 'Task Details',
                'form.taskTitle': 'Task Title *', 'form.taskTitlePlaceholder': 'Enter task title',
                'form.description': 'Description', 'form.descPlaceholder': 'Detailed description of the task...',
                'form.category': 'Category *', 'form.priority': 'Priority',
                'form.dueDate': 'Due Date', 'form.estimatedTime': 'Estimated Time (minutes) *',
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
            prayer: this.t('nav.prayer')
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
