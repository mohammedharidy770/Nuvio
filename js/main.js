// Handle sync conflicts explicitly. Previously this called an undefined optional
// method (showSyncConflict), silently dropping the conflict and leaving local
// changes unsynced forever.
window.addEventListener('nuvio:sync-conflict', async event => {
    const detail = event.detail || {};
    const message = detail.message || 'وجدنا اختلافًا بين بيانات هذا الجهاز والبيانات المحفوظة سحابيًا.';

    const keepLocal = window.confirm(
        message + '\n\n' +
        'اضغط "موافق" للاحتفاظ ببيانات هذا الجهاز ورفعها للسحابة.\n' +
        'اضغط "إلغاء" للاحتفاظ بالنسخة السحابية على هذا الجهاز.'
    );

    try {
        const resolved = await window.NuvioSync?.resolveConflict(keepLocal ? 'local' : 'remote');
        if (!resolved) {
            window.alert('لم تكتمل تسوية تعارض المزامنة. لم نحذف النسخ الاحتياطية؛ راجع الاتصال وحاول مرة أخرى.');
        } else {
            window.alert(keepLocal
                ? 'تم اعتماد بيانات هذا الجهاز ومزامنتها مع السحابة.'
                : 'تم اعتماد النسخة السحابية على هذا الجهاز.');
        }
    } catch (error) {
        console.error('Nuvio sync conflict resolution failed:', error);
        window.alert('تعذر إكمال المزامنة. بياناتك المحلية والنسخ الاحتياطية لم يتم حذفها.');
    }
});

window.app = new NuvioApp();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(error => {
        console.error('Service worker registration failed:', error);
    });
}
