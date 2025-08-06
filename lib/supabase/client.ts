import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a singleton instance to prevent multiple clients
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          "X-Client-Info": "discipline-rift-app",
        },
      },
    });
  }
  return supabaseInstance;
}

// Export the singleton instance
export const supabase = createClient();
