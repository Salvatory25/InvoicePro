import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const dbMode = (import.meta.env.VITE_DB_MODE as string | undefined) ?? 'local';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    dbMode === 'supabase'
);

export const supabaseClient: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getActiveBackendMode(): 'supabase' | 'local_transactional' {
  return isSupabaseConfigured ? 'supabase' : 'local_transactional';
}

