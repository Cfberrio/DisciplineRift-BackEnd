import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)")
}

// Export singleton instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'volleyball-app-server',
    },
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Create a function that returns the server supabase client
export function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'volleyball-app-server',
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createServiceSupabaseClient() {
  if (!supabaseServiceRoleKey) {
    const message = "Missing SUPABASE_SERVICE_ROLE_KEY environment variable for privileged operations"
    console.error(`[Supabase] ${message}`)
    throw new Error(message)
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'volleyball-app-server-service',
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
