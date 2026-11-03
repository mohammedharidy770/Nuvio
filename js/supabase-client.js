// ========================================
// NUVIO - SUPABASE CLIENT
// ========================================

(function () {
    'use strict';

    const config = window.NUVIO_SUPABASE_CONFIG;

    if (!config || !config.url || !config.anonKey) {
        console.error('Nuvio: Supabase configuration is missing.');
        return;
    }

    if (!window.supabase || !window.supabase.createClient) {
        console.error('Nuvio: Supabase library failed to load.');
        return;
    }

    const client = window.supabase.createClient(
        config.url,
        config.anonKey,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            }
        }
    );

    window.NuvioCloud = {
        client,

        async getSession() {
            const { data, error } = await client.auth.getSession();

            if (error) throw error;

            return data.session;
        },

        async getUser() {
            const { data, error } = await client.auth.getUser();

            if (error) throw error;

            return data.user;
        },

        onAuthStateChange(callback) {
            return client.auth.onAuthStateChange(callback);
        }
    };

    console.log('Nuvio: Supabase client initialized.');
})();