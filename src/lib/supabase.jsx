import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createFallbackAuth = () => ({
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({
    data: {
      subscription: {
        unsubscribe: () => {},
      },
    },
  }),
  signInWithPassword: async () => ({
    data: { user: null, session: null },
    error: {
      message:
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your deployment environment.",
    },
  }),
  signUp: async () => ({
    data: { user: null, session: null },
    error: {
      message:
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your deployment environment.",
    },
  }),
  signOut: async () => ({ error: null }),
});

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: createFallbackAuth(),
    };

export const isSupabaseReady = isSupabaseConfigured;
