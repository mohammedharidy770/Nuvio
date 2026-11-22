(function () {
    'use strict';

    const client = window.NuvioCloud?.client;
    if (!client) {
        console.error('Nuvio sync: Supabase client is unavailable.');
        return;
    }

    const TABLE = 'nuvio_data';
    const OWNER_KEY = 'nuvio_local_owner_id';
    const DIRTY_KEY = 'nuvio_local_dirty_at';
    const BACKUP_PREFIX = 'nuvio_account_backup_';
    const DATA_KEYS = [
        'nuvio_tasks', 'nuvio_sessions', 'nuvio_settings', 'nuvio_notifications',
        'nuvio_habits', 'nuvio_notes', 'nuvio_sleep', 'nuvio_water',
        'nuvio_prayer', 'nuvio_user_profile', 'nuvio_timer_state',
        'nuvio_ai_history', 'nuvio_ai_settings', DIRTY_KEY
    ];

    let userId = null;
    let ready = false;
    let timer = null;
    let busy = false;
    let applying = false;
    let dirty = false;
    let pendingSave = false;
    let generation = 0;
    let lastRemoteVersion = 0;
    let channel = null;
    let pendingConflict = null;

    function emit(name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    }

    function setPendingConflict(remoteData, remoteVersion, message) {
        const version = Number(remoteVersion);
        if (!remoteData || !Number.isFinite(version) || version < 1) return;
        pendingConflict = {
            remoteData,
            remoteVersion: version,
            detectedAt: new Date().toISOString()
        };
        emit('nuvio:sync-conflict', { message, remoteVersion: version });
    }

    async function resolveConflict(choice) {
        if (!pendingConflict || !userId || !ready || busy) return false;
        if (!['remote', 'local'].includes(choice)) return false;

        const conflict = pendingConflict;
        if (!backupLocalAccountData('sync-conflict-' + choice, userId)) return false;

        try {
            const remoteKey = BACKUP_PREFIX + 'cloud_' + userId + '_' + Date.now();
            localStorage.setItem(remoteKey, JSON.stringify({
                createdAt: new Date().toISOString(),
                reason: 'sync-conflict-remote-version',
                remoteVersion: conflict.remoteVersion,
                data: conflict.remoteData
            }));
        } catch (error) {
            console.error('Nuvio remote conflict backup failed; refusing resolution:', error);
            emit('nuvio:sync-error', { message: 'تعذر حفظ نسخة السحابة الاحتياطية؛ لم نغيّر أي بيانات.' });
            return false;
        }

        if (choice === 'remote') {
            pendingConflict = null;
            applySnapshot(conflict.remoteData);
            lastRemoteVersion = conflict.remoteVersion;
            dirty = false;
            localStorage.setItem(OWNER_KEY, userId);
            emit('nuvio:sync-resolved', { choice, version: lastRemoteVersion });
            return true;
        }

        lastRemoteVersion = conflict.remoteVersion;
        pendingConflict = null;
        dirty = true;
        try {
            await writeSnapshot();
        } catch (error) {
            handleSyncError(error);
            return false;
        }
        const resolved = !pendingConflict && !dirty;
        if (resolved) emit('nuvio:sync-resolved', { choice, version: lastRemoteVersion });
        return resolved;
    }

    function snapshot() {
        const app = window.app;
        return {
            nuvio_tasks: app?.tasks || [],
            nuvio_sessions: app?.focusSessions || [],
            nuvio_settings: app?.settings || {},
            nuvio_notifications: app?.notifications || [],
            nuvio_habits: app?.habits || [],
            nuvio_notes: app?.notes || [],
            nuvio_sleep: app?.sleepRecords || [],
            nuvio_water: app?.waterData || {},
            nuvio_prayer: app?.prayerData || {},
            nuvio_user_profile: app?.userProfile || {},
            nuvio_timer_state: (() => { try { return JSON.parse(localStorage.getItem('nuvio_timer_state') || 'null'); } catch { return null; } })(),
            nuvio_ai_history: (() => { try { return JSON.parse(localStorage.getItem('nuvio_ai_history') || '[]'); } catch { return []; } })(),
            nuvio_ai_settings: (() => { try { return JSON.parse(localStorage.getItem('nuvio_ai_settings') || '{}'); } catch { return {}; } })(),
            schemaVersion: 20
        };
    }

    function applySnapshot(data) {
        if (!data || typeof data !== 'object' || !window.app) return;

        applying = true;
        try {
            const app = window.app;
            const get = (current, legacy) => data[current] !== undefined ? data[current] : data[legacy];
            const tasks = get('tasks', 'nuvio_tasks');
            const sessions = get('focusSessions', 'nuvio_sessions');
            const settings = get('settings', 'nuvio_settings');
            const notifications = get('notifications', 'nuvio_notifications');
            const habits = get('habits', 'nuvio_habits');
            const notes = get('notes', 'nuvio_notes');
            const sleep = get('sleepRecords', 'nuvio_sleep');
            const water = get('waterData', 'nuvio_water');
            const prayer = get('prayerData', 'nuvio_prayer');
            const profile = get('userProfile', 'nuvio_user_profile');
            const timerState = get('timerState', 'nuvio_timer_state');
            const aiHistory = get('aiHistory', 'nuvio_ai_history');
            const aiSettings = get('aiSettings', 'nuvio_ai_settings');

            if (Array.isArray(tasks)) app.tasks = tasks;
            if (Array.isArray(sessions)) app.focusSessions = sessions;
            if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
                app.settings = { ...app.settings, ...settings };
            }
            if (Array.isArray(notifications)) app.notifications = notifications;
            if (Array.isArray(habits)) app.habits = habits;
            if (Array.isArray(notes)) app.notes = notes;
            if (Array.isArray(sleep)) app.sleepRecords = sleep;
            if (water && typeof water === 'object' && !Array.isArray(water)) app.waterData = water;
            if (prayer && typeof prayer === 'object' && !Array.isArray(prayer)) app.prayerData = prayer;
            if (profile && typeof profile === 'object' && !Array.isArray(profile)) app.userProfile = profile;

            const values = {
                nuvio_tasks: app.tasks,
                nuvio_sessions: app.focusSessions,
                nuvio_settings: app.settings,
                nuvio_notifications: app.notifications,
                nuvio_habits: app.habits,
                nuvio_notes: app.notes,
                nuvio_sleep: app.sleepRecords,
                nuvio_water: app.waterData,
                nuvio_prayer: app.prayerData,
                nuvio_user_profile: app.userProfile
            };

            Object.entries(values).forEach(([key, value]) => {
                localStorage.setItem(key, JSON.stringify(value));
            });

            localStorage.removeItem(DIRTY_KEY);
            if (timerState && typeof timerState === 'object' && !Array.isArray(timerState)) localStorage.setItem('nuvio_timer_state', JSON.stringify(timerState));
            if (Array.isArray(aiHistory)) localStorage.setItem('nuvio_ai_history', JSON.stringify(aiHistory));
            if (aiSettings && typeof aiSettings === 'object' && !Array.isArray(aiSettings)) localStorage.setItem('nuvio_ai_settings', JSON.stringify(aiSettings));
            app.applyTheme?.();
            app.applyLanguage?.();
            app.renderAll?.();
            app.renderHabits?.();
            app.renderNotes?.();
            emit('nuvio:remote-state-applied', {});
            if (timerState && typeof timerState === 'object' && !Array.isArray(timerState)) app.restoreTimerState?.();
        } finally {
            applying = false;
        }
    }

    function stableSerialize(value) {
        if (Array.isArray(value)) return '[' + value.map(stableSerialize).join(',') + ']';
        if (value && typeof value === 'object') {
            return '{' + Object.keys(value).sort().map(key =>
                JSON.stringify(key) + ':' + stableSerialize(value[key])
            ).join(',') + '}';
        }
        return JSON.stringify(value);
    }

    function snapshotsMatch(localData, remoteData) {
        if (!remoteData || typeof remoteData !== 'object') return false;
        try {
            return stableSerialize(localData) === stableSerialize(remoteData);
        } catch (error) {
            console.warn('Nuvio could not compare local and cloud snapshots:', error);
            return false;
        }
    }

    function hasLocalData() {
        const read = key => {
            try {
                const raw = localStorage.getItem(key);
                return raw === null ? null : JSON.parse(raw);
            } catch {
                return null;
            }
        };
        const hasItems = key => {
            const value = read(key);
            return Array.isArray(value) && value.length > 0;
        };

        // Only count actual user-created content. The app creates a default
        // water-tracking record during startup, which must not trigger a
        // local-vs-cloud conflict for a brand-new device.
        if (['nuvio_tasks', 'nuvio_sessions', 'nuvio_notifications',
            'nuvio_habits', 'nuvio_notes', 'nuvio_sleep'].some(hasItems)) return true;

        const profile = read('nuvio_user_profile');
        if (profile && (String(profile.name || '').trim() || profile.avatar)) return true;

        const settings = read('nuvio_settings');
        if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
            const defaults = {
                pomodoroDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
                darkMode: false, language: 'ar', timerNotification: true, taskReminder: true
            };
            if (Object.entries(settings).some(([key, value]) =>
                Object.prototype.hasOwnProperty.call(defaults, key) && value !== defaults[key]
            )) return true;
        }

        const water = read('nuvio_water');
        if (water && typeof water === 'object' && !Array.isArray(water)) {
            if (Number(water.today) > 0 || Number(water.goal || 8) !== 8 ||
                water.reminder === true || (water.history && Object.keys(water.history).length > 0)) return true;
        }

        const prayer = read('nuvio_prayer');
        if (prayer && typeof prayer === 'object' && !Array.isArray(prayer)) {
            if ((prayer.city && prayer.city !== 'Cairo') ||
                (prayer.method && String(prayer.method) !== '5') ||
                prayer.times || prayer.location) return true;
        }

        const timerState = read('nuvio_timer_state');
        if (timerState && typeof timerState === 'object' && !Array.isArray(timerState)) {
            if (timerState.running || timerState.paused || timerState.currentTask ||
                (timerState.mode && timerState.mode !== 'pomodoro') ||
                (Number(timerState.timeLeft) > 0 && Number(timerState.totalTime) > 0 &&
                    Number(timerState.timeLeft) !== Number(timerState.totalTime))) return true;
        }

        const aiHistory = read('nuvio_ai_history');
        if (Array.isArray(aiHistory) && aiHistory.some(chat =>
            Array.isArray(chat?.messages) && chat.messages.length > 0
        )) return true;

        const aiSettings = read('nuvio_ai_settings');
        if (aiSettings && typeof aiSettings === 'object' && Object.keys(aiSettings).length > 0) return true;

        return false;
    }

    function backupLocalAccountData(reason, nextUserId) {
        const data = {};
        DATA_KEYS.forEach(key => { const value = localStorage.getItem(key); if (value !== null) data[key] = value; });
        if (!Object.keys(data).length) return true;
        const owner = localStorage.getItem(OWNER_KEY) || 'unclaimed';
        const key = BACKUP_PREFIX + owner + '_' + Date.now();
        try {
            localStorage.setItem(key, JSON.stringify({ createdAt: new Date().toISOString(), reason, previousOwner: owner, nextUserId: nextUserId || null, data }));
            emit('nuvio:local-backup-created', { key, reason });
            return true;
        } catch (error) {
            console.error('Nuvio local backup failed; refusing destructive cleanup:', error);
            emit('nuvio:sync-error', { message: 'تعذر إنشاء نسخة احتياطية محلية؛ أوقفنا تبديل البيانات لحمايتها.' });
            return false;
        }
    }

    function clearLocalAccountData() {
        DATA_KEYS.forEach(key => localStorage.removeItem(key));
        // Keep recovery backups and pre-import backups intact.
    }

    function resetForDifferentAccount(nextUserId) {
        if (!backupLocalAccountData('account-switch', nextUserId)) {
            ready = false;
            userId = null;
            clearTimeout(timer);
            generation += 1;
            if (channel) { client.removeChannel(channel); channel = null; }
            return;
        }
        clearTimeout(timer);
        ready = false;
        dirty = false;
        pendingSave = false;
        pendingConflict = null;
        lastRemoteVersion = 0;
        generation += 1;

        if (channel) {
            client.removeChannel(channel);
            channel = null;
        }

        // The user approved clearing device-local data on account changes.
        // Remote data for both accounts remains untouched.
        clearLocalAccountData();
        localStorage.setItem(OWNER_KEY, nextUserId);
        userId = nextUserId;
        window.location.reload();
    }

    async function writeSnapshot() {
        if (!userId || !ready || applying || !navigator.onLine) return;
        if (busy) {
            pendingSave = true;
            return;
        }

        busy = true;
        const writeUserId = userId;
        const writeGeneration = generation;
        const localRevision = localStorage.getItem(DIRTY_KEY);

        try {
            const { data: row, error: readError } = await client
                .from(TABLE)
                .select('data,version')
                .eq('user_id', writeUserId)
                .maybeSingle();

            if (readError) throw readError;
            if (writeGeneration !== generation || writeUserId !== userId) return;

            const nextVersion = (Number(row?.version) || 0) + 1;
            const payload = {
                user_id: writeUserId,
                data: snapshot(),
                version: nextVersion,
                updated_at: new Date().toISOString()
            };

            if (row) {
                if ((Number(row.version) || 0) !== lastRemoteVersion) {
                    dirty = true;
                    setPendingConflict(row.data, Number(row.version), 'هناك نسخة أحدث على السحابة. اختر النسخة التي تريد الاحتفاظ بها.');
                    return;
                }
                const { data, error } = await client
                    .from(TABLE)
                    .update(payload)
                    .eq('user_id', writeUserId)
                    .eq('version', Number(row.version) || 0)
                    .select('version')
                    .maybeSingle();

                if (error) throw error;
                if (!data) {
                    dirty = true;
                    const { data: latest, error: latestError } = await client
                        .from(TABLE)
                        .select('data,version')
                        .eq('user_id', writeUserId)
                        .maybeSingle();
                    if (latestError) throw latestError;
                    if (latest) setPendingConflict(latest.data, Number(latest.version), 'تم تعديل البيانات من جهاز آخر أثناء الحفظ. اختر النسخة التي تريد الاحتفاظ بها.');
                    return;
                }
            } else {
                const { error } = await client.from(TABLE).insert(payload);
                if (error) {
                    if (error.code === '23505') {
                        dirty = true;
                        const { data: latest, error: latestError } = await client
                            .from(TABLE)
                            .select('data,version')
                            .eq('user_id', writeUserId)
                            .maybeSingle();
                        if (latestError) throw latestError;
                        if (latest) setPendingConflict(latest.data, Number(latest.version), 'تم إنشاء بيانات الحساب من جهاز آخر. اختر النسخة التي تريد الاحتفاظ بها.');
                        return;
                    }
                    throw error;
                }
            }

            if (writeGeneration === generation && writeUserId === userId) {
                lastRemoteVersion = nextVersion;
                if (localStorage.getItem(DIRTY_KEY) === localRevision) localStorage.removeItem(DIRTY_KEY);
                dirty = Boolean(localStorage.getItem(DIRTY_KEY));
            }
        } finally {
            busy = false;
            if (pendingSave && ready && userId) {
                pendingSave = false;
                setTimeout(() => writeSnapshot().catch(handleSyncError), 0);
            }
        }
    }

    function handleSyncError(error) {
        console.error('Nuvio cloud sync failed:', error);
        emit('nuvio:sync-error', { message: error?.message || 'تعذر حفظ البيانات سحابيًا.' });
    }

    async function syncNow() {
        if (!userId || !ready || busy || !navigator.onLine) return;

        busy = true;
        const syncUserId = userId;
        const syncGeneration = generation;

        try {
            const { data: row, error } = await client
                .from(TABLE)
                .select('data,updated_at,version')
                .eq('user_id', syncUserId)
                .maybeSingle();

            if (error) throw error;
            if (syncGeneration !== generation || syncUserId !== userId || !row) return;

            const remoteVersion = Number(row.version) || 0;
            if (remoteVersion > lastRemoteVersion) {
                if (dirty) {
                    setPendingConflict(row.data, remoteVersion, 'هناك تعديلات محلية وأخرى على جهاز مختلف. اختر النسخة التي تريد الاحتفاظ بها.');
                    return;
                }

                applySnapshot(row.data);
                lastRemoteVersion = remoteVersion;
                localStorage.setItem(OWNER_KEY, syncUserId);
            }
        } catch (error) {
            handleSyncError(error);
        } finally {
            busy = false;
        }
    }

    function scheduleSave() {
        if (applying) return;
        dirty = true;
        try { localStorage.setItem(DIRTY_KEY, String(Date.now())); } catch (error) {
            emit('nuvio:sync-error', { message: 'تعذر تسجيل حالة التعديل المحلي؛ صدّر نسخة احتياطية قبل تغيير الحساب.' });
        }
        if (!userId) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
            writeSnapshot().catch(handleSyncError);
        }, 900);
    }

    async function start(session) {
        const nextUserId = session?.user?.id || null;

        // Token refreshes and profile events for the active account must not
        // restart initialization or clear the pending local-change state.
        if (nextUserId && nextUserId === userId && ready) return;

        if (!nextUserId) {
            userId = null;
            ready = false;
            dirty = false;
            pendingConflict = null;
            clearTimeout(timer);
            if (channel) {
                client.removeChannel(channel);
                channel = null;
            }
            generation += 1;
            return;
        }

        const ownerId = localStorage.getItem(OWNER_KEY);
        if (ownerId && ownerId !== nextUserId) {
            resetForDifferentAccount(nextUserId);
            return;
        }

        userId = nextUserId;
        pendingConflict = null;
        const startGeneration = ++generation;
        ready = false;
        dirty = Boolean(localStorage.getItem(DIRTY_KEY));
        clearTimeout(timer);

        try {
            const { data: row, error } = await client
                .from(TABLE)
                .select('data,updated_at,version')
                .eq('user_id', nextUserId)
                .maybeSingle();

            if (error) throw error;
            if (startGeneration !== generation || userId !== nextUserId) return;

            let initialLocalConflict = null;
            const hasUnsentLocalChanges = Boolean(localStorage.getItem(DIRTY_KEY)) && hasLocalData();
            if (row) {
                lastRemoteVersion = Number(row.version) || 0;
                // A stale dirty marker can survive a refresh even when the actual
                // local snapshot is already identical to the cloud copy. Treat that
                // as synchronized instead of showing the same conflict repeatedly.
                const localMatchesCloud = hasUnsentLocalChanges && snapshotsMatch(snapshot(), row.data);
                if (localMatchesCloud) {
                    localStorage.removeItem(DIRTY_KEY);
                    dirty = false;
                }
                if ((!ownerId && hasLocalData()) || (hasUnsentLocalChanges && !localMatchesCloud)) {
                    if (!backupLocalAccountData('initial-device-cloud-conflict', nextUserId)) throw new Error('Local backup failed; refusing to replace local data.');
                    localStorage.setItem(OWNER_KEY, nextUserId);
                    dirty = true;
                    initialLocalConflict = { data: row.data, version: lastRemoteVersion };
                } else {
                    applySnapshot(row.data);
                    localStorage.setItem(OWNER_KEY, nextUserId);
                    dirty = false;
                }
            } else {
                // With no cloud row, preserve and claim existing unassigned device data.
                localStorage.setItem(OWNER_KEY, nextUserId);
                ready = true;
                await writeSnapshot();
            }

            if (startGeneration !== generation || userId !== nextUserId) return;
            ready = true;

            if (channel) await client.removeChannel(channel);
            channel = client
                .channel('nuvio-data-' + nextUserId)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: TABLE,
                    filter: 'user_id=eq.' + nextUserId
                }, payload => {
                    const incomingVersion = Number(payload.new?.version) || 0;
                    if (!incomingVersion || incomingVersion <= lastRemoteVersion || applying) return;

                    if (dirty) {
                        setPendingConflict(payload.new.data, incomingVersion, 'وصل تحديث من جهاز آخر بينما لديك تعديلات محلية. اختر النسخة التي تريد الاحتفاظ بها.');
                        return;
                    }

                    applySnapshot(payload.new.data);
                    lastRemoteVersion = incomingVersion;
                })
                .subscribe();

            emit('nuvio:sync-ready', { userId: nextUserId });
            if (initialLocalConflict) {
                setPendingConflict(initialLocalConflict.data, initialLocalConflict.version,
                    'وجدنا بيانات مختلفة على هذا الجهاز وفي السحابة. اختر أي نسخة تريد استخدامها.');
            }
        } catch (error) {
            ready = false;
            handleSyncError(error);
        }
    }

    client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            start(null);
            return;
        }

        if (session && ['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
            setTimeout(() => start(session), 0);
        }
    });

    window.addEventListener('focus', syncNow);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') syncNow();
    });
    window.addEventListener('online', syncNow);

    window.NuvioSync = { scheduleSave, syncNow, resolveConflict };

    client.auth.getSession()
        .then(({ data, error }) => {
            if (error) throw error;
            return start(data.session);
        })
        .catch(handleSyncError);
})();
