import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://vtpbilwtfdkwkcouropt.supabase.co'
).trim();

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable__fFqlLQcJKfuQHHPqS79iQ_57BgMdtC'
).trim();

let clientInstance: any = null;

if (supabaseUrl.startsWith('http') && supabaseAnonKey) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase] Initialization failed, using fallback:', err);
  }
}

if (!clientInstance) {
  // Graceful local fallback if Supabase client fails to initialize
  const authListeners: Array<(event: string, session: any) => void> = [];

  const getStoredSession = () => {
    try {
      const raw = localStorage.getItem('mb_supabase_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const setStoredSession = (session: any) => {
    try {
      if (session) {
        localStorage.setItem('mb_supabase_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('mb_supabase_session');
      }
    } catch {}
  };

  clientInstance = {
    auth: {
      getSession: async () => ({ data: { session: getStoredSession() }, error: null }),
      getUser: async () => {
        const session = getStoredSession();
        return { data: { user: session?.user || null }, error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        authListeners.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const idx = authListeners.indexOf(callback);
                if (idx !== -1) authListeners.splice(idx, 1);
              },
            },
          },
        };
      },
      signInWithOtp: async ({ email }: { email: string }) => {
        return { data: { user: null, session: null }, error: null };
      },
      verifyOtp: async ({ email, token }: { email: string; token: string }) => {
        const user = {
          id: 'usr_' + Date.now(),
          email: email.trim(),
          user_metadata: { nickname: email.split('@')[0] },
        };
        const session = { access_token: 'token_' + Date.now(), user };
        setStoredSession(session);
        authListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { user, session }, error: null };
      },
      signOut: async () => {
        setStoredSession(null);
        authListeners.forEach(cb => cb('SIGNED_OUT', null));
        return { error: null };
      },
      updateUser: async ({ data }: { data: any }) => {
        const session = getStoredSession();
        if (session && session.user) {
          session.user.user_metadata = { ...session.user.user_metadata, ...data };
          setStoredSession(session);
          authListeners.forEach(cb => cb('USER_UPDATED', session));
          return { data: { user: session.user }, error: null };
        }
        return { data: { user: null }, error: new Error('No user session') };
      },
    },
    from: () => ({
      select: () => ({ then: (r: any) => r({ data: [], error: null }) }),
      insert: () => ({ then: (r: any) => r({ data: null, error: null }) }),
      update: () => ({ then: (r: any) => r({ data: null, error: null }) }),
      delete: () => ({ then: (r: any) => r({ data: null, error: null }) }),
    }),
  };
}

export const supabase = clientInstance;


