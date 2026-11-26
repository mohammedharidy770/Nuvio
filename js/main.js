// Sync conflicts are reconciled automatically by cloud-sync.js after preserving
// both copies in a local backup. No blocking confirm/alert dialogs are shown.
window.app = new NuvioApp();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(error => {
        console.error('Service worker registration failed:', error);
    });
}
