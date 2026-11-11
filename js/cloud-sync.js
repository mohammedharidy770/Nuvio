(function () {
    'use strict';

    const client = window.NuvioCloud?.client;
    if (!client) {
        console.error('Nuvio sync: Supabase client is unavailable.');
        return;
    }

    const TABLE = 'nuvio_data';
    const OWNER_KEY = 'nuvio_local_owner_id';
    const BACKUP_PREFIX = 'nuvio_account_backup_';
    const DATA_KEYS = [
        'nuvio_tasks', 'nuvio_sessions', 'nuvio_settings', 'nuvio_notifications',
        'nuvio_habits', 'nuvio_notes', 'nuvio_sleep', 'nuvio_water',
        'nuvio_prayer', 'nuvio_user_profile', 'nuvio_timer_state',
        'nuvio_ai_history', 'nuvio_ai_settings'
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

    function emit(name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
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
            schemaVersion: 19
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

            app.applyTheme?.();
            app.applyLanguage?.();
            app.renderAll?.();
            app.renderHabits?.();
            app.renderNotes?.();
        } finally {
            applying = false;
        }
    }

    function hasLocalData() {
        return DATA_KEYS.some(key => {
            const value = localStorage.getItem(key);
            return value && value !== '[]' && value !== '{}';
        });
    }

    function archiveAndClearLocalData(owner) {
        const backup = {};
        DATA_KEYS.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) backup[key] = value;
        });

        if (Object.keys(backup).length) {
            const suffix = owner || 'unclaimed';
            const backupKey = BACKUP_PREFIX + suffix;
            if (!localStorage.getItem(backupKey)) {
                localStorage.setItem(backupKey, JSON.stringify({
                    createdAt: new Date().toISOString(),
                    data: backup
                }));
            }
        }

        DATA_KEYS.forEach(key => localStorage.removeItem(key));
        localStorage.setItem(OWNER_KEY, userId);
    }

    function resetForDifferentAccount(nextUserId) {
        clearTimeout(timer);
        ready = false;
        dirty = false;
        pendingSave = false;
        if (channel) {
            client.removeChannel(channel);
            channel = null;
        }

        const previousOwner = localStorage.getItem(OWNER_KEY);
        const backup = {};
        DATA_KEYS.forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) backup[key] = value;
        });

        if (Object.keys(backup).length) {
            const backupKey = BACKUP_PREFIX + (previousOwner || 'unclaimed');
            if (!localStorage.getItem(backupKey)) {
                localStorage.setItem(backupKey, JSON.stringify({
                    createdAt: new Date().toISOString(),
                    data: backup
                }));
            }
        }

        DATA_KEYS.forEach(key => localStorage.removeItem(key));
        localStorage.setItem(OWNER_KEY, nextUserId);
        userId = nextUserId;
        generation += 1;

        // Reinitialize the app from a clean account-specific local state.
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

        try {
            const { data: row, error: readError } = await client
                .from(TABLE)
                .select('version')
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
                    emit('nuvio:sync-conflict', {
                        message: 'هناك نسخة أحدث على السحابة. احتفظنا بالتعديلات المحلية ولم نستبدلها.'
                    });
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
                    emit('nuvio:sync-conflict', {
                        message: 'تم تعديل البيانات من جهاز آخر. احتفظنا بالتعديلات المحلية ولم نستبدلها.'
                    });
                    return;
                }
            } else {
                const { error } = await client.from(TABLE).insert(payload);
                if (error) {
                    if (error.code === '23505') {
                        dirty = true;
                        emit('nuvio:sync-conflict', {
                            message: 'تم إنشاء سجل الحساب من جهاز آخر. أعد المزامنة قبل الحفظ.'
                        });
                        return;
                    }
                    throw error;
                }
            }

            if (writeGeneration === generation && writeUserId === userId) {
                lastRemoteVersion = nextVersion;
                dirty = false;
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
                    emit('nuvio:sync-conflict', {
                        message: 'هناك تعديلات محلية وأخرى على جهاز مختلف. لم نستبدل أيًا منهما تلقائيًا.'
                    });
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
        if (!userId || applying) return;
        dirty = true;
        clearTimeout(timer);
        timer = setTimeout(() => {
            writeSnapshot().catch(handleSyncError);
        }, 900);
    }

    async function start(session) {
        const nextUserId = session?.user?.id || null;

        if (!nextUserId) {
            userId = null;
            ready = false;
            dirty = false;
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
        const startGeneration = ++generation;
        ready = false;
        dirty = false;
        clearTimeout(timer);

        try {
            const { data: row, error } = await client
                .from(TABLE)
                .select('data,updated_at,version')
                .eq('user_id', nextUserId)
                .maybeSingle();

            if (error) throw error;
            if (startGeneration !== generation || userId !== nextUserId) return;

            if (row) {
                if (!ownerId && hasLocalData()) archiveAndClearLocalData(null);
                applySnapshot(row.data);
                lastRemoteVersion = Number(row.version) || 0;
                localStorage.setItem(OWNER_KEY, nextUserId);
                dirty = false;
            } else {
                const unclaimedLocalData = !ownerId && hasLocalData();
                if (unclaimedLocalData) {
                    const adopt = window.confirm(
                        'وجدنا بيانات محفوظة على هذا الجهاز ولم يتم ربطها بحساب بعد. هل تريد ربطها بالحساب الحالي؟\n\nاختَر "إلغاء" للاحتفاظ بنسخة احتياطية محلية والبدء ببيانات حساب فارغة.'
                    );

                    if (startGeneration !== generation || userId !== nextUserId) return;

                    if (!adopt) {
                        archiveAndClearLocalData(null);
                        window.location.reload();
                        return;
                    }
                }

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
                        emit('nuvio:sync-conflict', {
                            message: 'وصل تحديث من جهاز آخر بينما لديك تعديلات محلية. لم نستبدل بياناتك.'
                        });
                        return;
                    }

                    applySnapshot(payload.new.data);
                    lastRemoteVersion = incomingVersion;
                })
                .subscribe();
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

    window.NuvioSync = { scheduleSave, syncNow };

    client.auth.getSession()
        .then(({ data, error }) => {
            if (error) throw error;
            return start(data.session);
        })
        .catch(handleSyncError);
})();
