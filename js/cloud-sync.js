(function () {
    'use strict';

    const client = window.NuvioCloud?.client;
    if (!client) {
        console.error('Nuvio sync: Supabase client is unavailable.');
        return;
    }

    const TABLE = 'nuvio_user_state';
    const OWNER_KEY = 'nuvio_local_owner_id';
    const DIRTY_KEY = 'nuvio_local_dirty_at';
    const CHANNEL_NAME = 'nuvio-local-state-v1';
    const KEYS = [
        'nuvio_tasks', 'nuvio_sessions', 'nuvio_settings', 'nuvio_notifications',
        'nuvio_habits', 'nuvio_notes', 'nuvio_sleep', 'nuvio_water',
        'nuvio_prayer', 'nuvio_user_profile', 'nuvio_timer_state',
        'nuvio_ai_history', 'nuvio_ai_settings'
    ];

    let userId = null;
    let ready = false;
    let applying = false;
    let dirty = false;
    let busy = false;
    let pendingRemoteCheck = false;
    let pendingWrite = false;
    let timer = null;
    let revision = 0;
    let generation = 0;
    let realtimeChannel = null;
    let pendingConflict = null;
    let localChannel = null;
    let handoffTimer = null;
    let pendingOwnerSeen = false;
    const HANDOFF_MS = 1500;

    const emit = (name, detail = {}) =>
        window.dispatchEvent(new CustomEvent(name, { detail }));

    function readJSON(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function snapshot() {
        const app = window.app;
        return {
            schemaVersion: 1,
            tasks: app?.tasks || readJSON('nuvio_tasks', []),
            focusSessions: app?.focusSessions || readJSON('nuvio_sessions', []),
            settings: app?.settings || readJSON('nuvio_settings', {}),
            notifications: app?.notifications || readJSON('nuvio_notifications', []),
            habits: app?.habits || readJSON('nuvio_habits', []),
            notes: app?.notes || readJSON('nuvio_notes', []),
            sleepRecords: app?.sleepRecords || readJSON('nuvio_sleep', []),
            waterData: app?.waterData || readJSON('nuvio_water', {}),
            prayerData: app?.prayerData || readJSON('nuvio_prayer', {}),
            userProfile: app?.userProfile || readJSON('nuvio_user_profile', {}),
            timerState: readJSON('nuvio_timer_state', null),
            aiHistory: readJSON('nuvio_ai_history', []),
            aiSettings: readJSON('nuvio_ai_settings', {})
        };
    }

    function hasUserData(data) {
        if (!data || typeof data !== 'object') return false;
        const hasCollections = ['tasks', 'focusSessions', 'notifications', 'habits', 'notes', 'sleepRecords', 'aiHistory']
            .some(key => Array.isArray(data[key]) && data[key].length > 0);
        if (hasCollections) return true;

        const profile = data.userProfile || {};
        if (profile.name || profile.avatar) return true;

        // Default app preferences are initialized on every fresh browser.
        // Do not mistake those defaults for pre-existing user data and show
        // a false conflict instead of restoring the signed-in user's cloud state.
        const defaults = {
            pomodoroDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            darkMode: false,
            language: 'ar',
            timerNotification: true,
            taskReminder: true
        };
        const settings = data.settings || {};
        if (Object.keys(settings).some(key =>
            !Object.prototype.hasOwnProperty.call(defaults, key) ||
            settings[key] !== defaults[key]
        )) return true;

        const timer = data.timerState;
        if (timer && typeof timer === 'object' &&
            (timer.running || timer.paused || timer.currentTask || timer.endAt)) return true;

        const water = data.waterData || {};
        if ((Number(water.today) || 0) > 0 || Object.keys(water.history || {}).length > 0) return true;

        return false;
    }

    function persistSnapshot(data, { keepDirtyMarker = false } = {}) {
        const app = window.app;
        if (!app || !data || typeof data !== 'object') return;
        applying = true;
        try {
            app.tasks = Array.isArray(data.tasks) ? data.tasks : [];
            app.focusSessions = Array.isArray(data.focusSessions) ? data.focusSessions : [];
            app.settings = data.settings && typeof data.settings === 'object' ? { ...app.settings, ...data.settings } : app.settings;
            app.notifications = Array.isArray(data.notifications) ? data.notifications : [];
            app.habits = Array.isArray(data.habits) ? data.habits : [];
            app.notes = Array.isArray(data.notes) ? data.notes : [];
            app.sleepRecords = Array.isArray(data.sleepRecords) ? data.sleepRecords : [];
            app.waterData = data.waterData && typeof data.waterData === 'object' ? data.waterData : app.waterData;
            app.prayerData = data.prayerData && typeof data.prayerData === 'object' ? data.prayerData : app.prayerData;
            app.userProfile = data.userProfile && typeof data.userProfile === 'object' ? data.userProfile : app.userProfile;

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
            Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
            if (data.timerState !== undefined) localStorage.setItem('nuvio_timer_state', JSON.stringify(data.timerState));
            if (Array.isArray(data.aiHistory)) localStorage.setItem('nuvio_ai_history', JSON.stringify(data.aiHistory));
            if (data.aiSettings && typeof data.aiSettings === 'object') localStorage.setItem('nuvio_ai_settings', JSON.stringify(data.aiSettings));

            if (!keepDirtyMarker) localStorage.removeItem(DIRTY_KEY);
            app.applyTheme?.();
            app.applyLanguage?.();
            app.renderAll?.();
            app.renderHabits?.();
            app.renderNotes?.();
            app.renderSleep?.();
            app.renderWater?.();
            if (data.timerState && typeof data.timerState === 'object') app.restoreTimerState?.();
        } finally {
            applying = false;
        }
    }

    function localStorageSnapshot() {
        return {
            schemaVersion: 1,
            tasks: readJSON('nuvio_tasks', []),
            focusSessions: readJSON('nuvio_sessions', []),
            settings: readJSON('nuvio_settings', {}),
            notifications: readJSON('nuvio_notifications', []),
            habits: readJSON('nuvio_habits', []),
            notes: readJSON('nuvio_notes', []),
            sleepRecords: readJSON('nuvio_sleep', []),
            waterData: readJSON('nuvio_water', {}),
            prayerData: readJSON('nuvio_prayer', {}),
            userProfile: readJSON('nuvio_user_profile', {}),
            timerState: readJSON('nuvio_timer_state', null),
            aiHistory: readJSON('nuvio_ai_history', []),
            aiSettings: readJSON('nuvio_ai_settings', {})
        };
    }

    function same(a, b) {
        try { return JSON.stringify(sortObject(a)) === JSON.stringify(sortObject(b)); }
        catch { return false; }
    }

    function sortObject(value) {
        if (Array.isArray(value)) return value.map(sortObject);
        if (value && typeof value === 'object') {
            return Object.keys(value).sort().reduce((out, key) => {
                out[key] = sortObject(value[key]);
                return out;
            }, {});
        }
        return value;
    }

    async function fetchRemote() {
        const { data, error } = await client.from(TABLE)
            .select('state,revision,updated_at')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    function raiseConflict(remote) {
        pendingConflict = remote;
        // Notify only after the current initialization/read operation releases
        // its busy lock; the dialog handler may immediately resolve the choice.
        setTimeout(() => {
            if (!pendingConflict || pendingConflict !== remote) return;
            emit('nuvio:sync-conflict', {
                message: 'فيه اختلاف بين بيانات هذا الجهاز والنسخة السحابية. اختر النسخة التي تريد الاحتفاظ بها.',
                remoteVersion: remote.revision
            });
        }, 0);
    }

    async function applyRemoteIfNewer() {
        if (!ready || !userId || applying) return;
        if (otherTabPending()) return checkOtherTabPending();
        if (busy) {
            pendingRemoteCheck = true;
            return;
        }
        busy = true;
        try {
            const remote = await fetchRemote();
            if (!remote || Number(remote.revision) <= revision) return;
            if (dirty) {
                raiseConflict(remote);
                return;
            }
            persistSnapshot(remote.state);
            revision = Number(remote.revision);
            emit('nuvio:sync-updated', { revision });
        } catch (error) {
            report(error);
        } finally {
            busy = false;
            flushPendingWork();
        }
    }

    function flushPendingWork() {
        if (busy || !ready || !userId) return;
        if (pendingWrite || dirty) {
            pendingWrite = false;
            setTimeout(() => writeState(), 0);
            return;
        }
        if (pendingRemoteCheck) {
            pendingRemoteCheck = false;
            setTimeout(() => applyRemoteIfNewer(), 0);
        }
    }

    function report(error) {
        console.error('Nuvio sync failed:', error);
        emit('nuvio:sync-error', { message: 'تعذرت مزامنة البيانات الآن. ستتم إعادة المحاولة تلقائيًا.' });
    }

    async function syncNow() {
        if (!ready || !userId || busy) return;
        if (dirty) return writeState();
        if (otherTabPending()) return checkOtherTabPending();
        return applyRemoteIfNewer();
    }

    async function writeState() {
        if (!ready || !userId || !dirty) return;
        if (busy) {
            pendingWrite = true;
            return;
        }
        busy = true;
        const currentUser = userId;
        const currentGeneration = generation;
        const data = snapshot();
        try {
            const { data: saved, error } = await client.rpc('nuvio_save_state', {
                p_state: data,
                p_expected_revision: revision
            });
            if (error) {
                if (error.code === '40001' || String(error.message || '').includes('revision_conflict')) {
                    const remote = await fetchRemote();
                    if (remote) raiseConflict(remote);
                    return;
                }
                throw error;
            }
            if (currentGeneration !== generation || currentUser !== userId) return;
            const row = Array.isArray(saved) ? saved[0] : saved;
            if (!row) throw new Error('The save RPC returned no row.');
            revision = Number(row.revision);
            dirty = false;
            localStorage.removeItem(DIRTY_KEY);
            if (localChannel) localChannel.postMessage({ type: 'saved', revision });
            emit('nuvio:sync-saved', { revision });
        } catch (error) {
            report(error);
        } finally {
            busy = false;
            flushPendingWork();
        }
    }

    function scheduleSave() {
        if (applying) return;
        dirty = true;
        try { localStorage.setItem(DIRTY_KEY, String(Date.now())); } catch (error) {
            console.warn('Nuvio could not store the dirty marker:', error);
        }
        if (localChannel) localChannel.postMessage({ type: 'local-change', at: Date.now() });
        clearTimeout(timer);
        timer = setTimeout(() => writeState(), 650);
    }

    async function resolveConflict(choice) {
        if (!pendingConflict || !ready || busy || !['local', 'remote'].includes(choice)) return false;
        const remote = pendingConflict;
        pendingConflict = null;
        if (choice === 'remote') {
            persistSnapshot(remote.state);
            revision = Number(remote.revision);
            dirty = false;
            localStorage.setItem(OWNER_KEY, userId);
            emit('nuvio:sync-resolved', { choice, revision });
            return true;
        }
        revision = Number(remote.revision);
        dirty = true;
        await writeState();
        return !dirty;
    }

    async function start(session) {
        const nextUserId = session?.user?.id || null;
        if (!nextUserId) {
            userId = null;
            ready = false;
            dirty = false;
            pendingConflict = null;
            generation += 1;
            clearTimeout(timer);
            if (realtimeChannel) {
                client.removeChannel(realtimeChannel);
                realtimeChannel = null;
            }
            return;
        }
        if (nextUserId === userId && ready) return;

        const oldOwner = localStorage.getItem(OWNER_KEY);
        if (oldOwner && oldOwner !== nextUserId) {
            userId = nextUserId;
            ready = false;
            emit('nuvio:sync-error', { message: 'الحساب الحالي مختلف عن الحساب الذي يملك البيانات المحلية. سجّل خروجًا ثم ادخل بالحساب الصحيح قبل المزامنة.' });
            return;
        }

        userId = nextUserId;
        const currentGeneration = ++generation;
        ready = false;
        dirty = Boolean(localStorage.getItem(DIRTY_KEY));

        try {
            const remote = await fetchRemote();
            if (currentGeneration !== generation || userId !== nextUserId) return;

            if (!remote) {
                const initial = snapshot();
                const { data, error } = await client.rpc('nuvio_save_state', {
                    p_state: initial,
                    p_expected_revision: 0
                });
                if (error) throw error;
                const row = Array.isArray(data) ? data[0] : data;
                revision = Number(row?.revision || 1);
                dirty = false;
                localStorage.removeItem(DIRTY_KEY);
            } else {
                revision = Number(remote.revision);
                const local = snapshot();
                const localHasData = hasUserData(local);
                const remoteHasData = hasUserData(remote.state);
                const localWasOwned = oldOwner === nextUserId;
                if (localHasData && (!remoteHasData || !localWasOwned || (dirty && localWasOwned))) {
                    raiseConflict(remote);
                } else {
                    persistSnapshot(remote.state);
                    dirty = false;
                }
            }

            if (currentGeneration !== generation || userId !== nextUserId) return;
            localStorage.setItem(OWNER_KEY, nextUserId);
            ready = true;

            if (realtimeChannel) await client.removeChannel(realtimeChannel);
            realtimeChannel = client.channel('nuvio-state-v1-' + nextUserId)
                .on('postgres_changes', {
                    event: '*', schema: 'public', table: TABLE,
                    filter: 'user_id=eq.' + nextUserId
                }, payload => {
                    const incoming = Number(payload.new?.revision || 0);
                    if (incoming > revision) applyRemoteIfNewer();
                })
                .subscribe(status => {
                    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        console.warn('Nuvio Realtime reconnecting; foreground sync will retry.');
                    }
                });
            emit('nuvio:sync-ready', { userId: nextUserId, revision });
        } catch (error) {
            ready = false;
            report(error);
        }
    }

    // Another tab of this browser changed local data. That tab owns the cloud
    // write, so only mirror its state here; writing from every tab would race
    // on the same revision and raise false sync conflicts.
    function mirrorLocalChange() {
        if (applying) return;
        persistSnapshot(localStorageSnapshot(), { keepDirtyMarker: true });
    }

    // A shared dirty marker without a local dirty flag means another tab made a
    // change that is not in the cloud yet. Ask whether that tab is still alive;
    // if nobody owns the change (e.g. the tab was closed offline), take over the
    // upload instead of letting a newer cloud snapshot overwrite it.
    function otherTabPending() {
        return !dirty && !!localStorage.getItem(DIRTY_KEY);
    }

    function checkOtherTabPending() {
        if (handoffTimer) return;
        pendingOwnerSeen = false;
        if (localChannel) localChannel.postMessage({ type: 'pending-query' });
        handoffTimer = setTimeout(() => {
            handoffTimer = null;
            if (!otherTabPending()) {
                applyRemoteIfNewer();
            } else if (!pendingOwnerSeen) {
                dirty = true;
                writeState();
            }
        }, HANDOFF_MS);
    }

    if ('BroadcastChannel' in window) {
        localChannel = new BroadcastChannel(CHANNEL_NAME);
        localChannel.addEventListener('message', event => {
            if (event.data?.type === 'local-change') {
                mirrorLocalChange();
            } else if (event.data?.type === 'pending-query') {
                if (dirty) localChannel.postMessage({ type: 'pending-owner' });
            } else if (event.data?.type === 'pending-owner') {
                pendingOwnerSeen = true;
            } else if (event.data?.type === 'saved' && !dirty) {
                const saved = Number(event.data.revision) || 0;
                if (saved > revision) revision = saved;
            }
        });
    } else {
        window.addEventListener('storage', event => {
            if (KEYS.includes(event.key)) mirrorLocalChange();
        });
    }

    client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') start(null);
        else if (session && ['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
            setTimeout(() => start(session), 0);
        }
    });

    window.addEventListener('focus', syncNow);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') syncNow();
    });
    window.addEventListener('online', syncNow);
    setInterval(() => {
        if (document.visibilityState === 'visible') syncNow();
    }, 20000);

    window.NuvioSync = { scheduleSave, syncNow, resolveConflict };

    client.auth.getSession()
        .then(({ data, error }) => {
            if (error) throw error;
            return start(data.session);
        })
        .catch(report);
})();
