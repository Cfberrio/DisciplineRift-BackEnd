import { supabase } from "../supabase/client"
import { createServerSupabaseClient } from "../supabase/server"

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResponse {
  success: boolean
  error?: AuthError
  redirectTo?: string
}

export interface AuthUser {
  id: string
  email: string
  isAdmin: boolean
  adminData?: any
}

// Client-side authentication functions
export const authService = {
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Use the imported supabase instance

      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: { message: "Email and password are required" },
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(credentials.email)) {
        return {
          success: false,
          error: { message: "Please enter a valid email address" },
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      })

      if (error) {
        return {
          success: false,
          error: {
            message: getAuthErrorMessage(error.message),
            code: error.message,
          },
        }
      }

      if (data.user && data.session) {
        // Check if user exists in admin table
        const { data: adminData, error: adminError } = await supabase
          .from("admin")
          .select("*")
          .eq("email", data.user.email)
          .single()

        if (adminError && adminError.code !== "PGRST116") {
          console.error("Error checking admin status:", adminError)
        }

        if (!adminData) {
          // Sign out if not an admin
          await supabase.auth.signOut()
          return {
            success: false,
            error: { message: "You don't have permissions to access this application" },
          }
        }

        return {
          success: true,
          redirectTo: "/",
        }
      }

      return {
        success: false,
        error: { message: "Authentication failed. Please try again." },
      }
    } catch (error) {
      console.error("Authentication error:", error)
      return {
        success: false,
        error: { message: "Network error. Please check your connection and try again." },
      }
    }
  },

  async signOut(): Promise<AuthResponse> {
    try {
      // Use the imported supabase instance
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: { message: "Error al cerrar sesión. Por favor intenta de nuevo." },
        }
      }

      return {
        success: true,
        redirectTo: "/login",
      }
    } catch (error) {
      console.error("Sign out error:", error)
      return {
        success: false,
        error: { message: "Error de red durante el cierre de sesión." },
      }
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Use the imported supabase instance

      // First check if we have a session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        return null
      }

      if (!session) {
        // No session exists
        return null
      }

      // Get user from session
      const user = session.user

      if (user) {
        // Check admin status
        const { data: adminData, error: adminError } = await supabase
          .from("admin")
          .select("*")
          .eq("email", user.email)
          .single()

        if (adminError && adminError.code !== "PGRST116") {
          console.error("Error checking admin status:", adminError)
        }

        return {
          id: user.id,
          email: user.email || "",
          isAdmin: !!adminData,
          adminData: adminData || null,
        }
      }

      return null
    } catch (error) {
      console.error("Get current user error:", error)
      return null
    }
  },
}

// Server-side authentication functions
export const authServer = {
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const supabase = createServerSupabaseClient()

      // Get session first
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Server session error:", sessionError)
        return null
      }

      if (!session) {
        return null
      }

      const user = session.user

      if (user) {
        // Check admin status
        const { data: adminData, error: adminError } = await supabase
          .from("admin")
          .select("*")
          .eq("email", user.email)
          .single()

        if (adminError && adminError.code !== "PGRST116") {
          console.error("Error checking admin status:", adminError)
        }

        return {
          id: user.id,
          email: user.email || "",
          isAdmin: !!adminData,
          adminData: adminData || null,
        }
      }

      return null
    } catch (error) {
      console.error("Server get current user error:", error)
      return null
    }
  },

  async getSession() {
    try {
      const supabase = createServerSupabaseClient()
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Get session error:", error)
        return null
      }

      return session
    } catch (error) {
      console.error("Get session error:", error)
      return null
    }
  },
}

// Legacy exports for backward compatibility
export const serverAuthService = authServer

function getAuthErrorMessage(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials":
      "Incorrect email or password. Please verify your credentials and try again.",
    "Email not confirmed": "Please check your email and click the confirmation link before signing in.",
    "Too many requests":
      "Too many login attempts. Please wait a few minutes before trying again.",
    "User not found": "No account found with this email address.",
    "Invalid email": "Please enter a valid email address.",
    "Weak password": "Password must be at least 6 characters long.",
    "Email already registered": "An account with this email already exists.",
    "Network error": "Network connection error. Please check your internet connection.",
    "Auth session missing": "Session not found. Please sign in again.",
  }

  // Check for partial matches
  for (const [key, message] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return message
    }
  }

  return "Authentication failed. Please try again."
}
