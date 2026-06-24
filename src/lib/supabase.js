import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Modo demo cuando no hay credenciales configuradas
export const DEMO_MODE = !supabaseUrl || !supabaseAnonKey

export const supabase = DEMO_MODE
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey)

function createMockClient() {
  const noop = async () => ({ data: null, error: null })
  const noopSelect = () => ({
    select: () => ({
      eq: () => ({ data: [], error: null }),
      in: () => ({ data: [], error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
      limit: () => ({ data: [], error: null }),
      order: () => ({ data: [], error: null }),
    }),
    eq: () => ({
      eq: () => ({ data: [], error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
    }),
    insert: async () => ({ data: null, error: null }),
    upsert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
  })

  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Modo demo — configura Supabase en .env.local' } }),
      signUp: async () => ({ data: { user: { id: 'demo' } }, error: null }),
      signOut: async () => {},
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ data: [], error: null }),
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          limit: () => ({ data: [], error: null }),
          in: () => ({ data: [], error: null }),
        }),
        in: () => ({ data: [], error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        order: () => ({ limit: () => ({ data: [], error: null }) }),
      }),
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
  }
}
