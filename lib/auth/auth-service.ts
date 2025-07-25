import { createClient } from "../supabase/client"
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
      const supabase = createClient()

      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: { message: "Email y contraseña son requeridos" },
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(credentials.email)) {
        return {
          success: false,
          error: { message: "Por favor ingresa una dirección de email válida" },
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
            error: { message: "No tienes permisos para acceder a esta aplicación" },
          }
        }

        return {
          success: true,
          redirectTo: "/",
        }
      }

      return {
        success: false,
        error: { message: "Autenticación fallida. Por favor intenta de nuevo." },
      }
    } catch (error) {
      console.error("Authentication error:", error)
      return {
        success: false,
        error: { message: "Error de red. Por favor verifica tu conexión e intenta de nuevo." },
      }
    }
  },

  async signOut(): Promise<AuthResponse> {
    try {
      const supabase = createClient()
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
      const supabase = createClient()

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
      const supabase = await createServerSupabaseClient()

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
      const supabase = await createServerSupabaseClient()
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
      "Email o contraseña incorrectos. Por favor verifica tus credenciales e intenta de nuevo.",
    "Email not confirmed": "Por favor revisa tu email y haz clic en el enlace de confirmación antes de iniciar sesión.",
    "Too many requests":
      "Demasiados intentos de inicio de sesión. Por favor espera unos minutos antes de intentar de nuevo.",
    "User not found": "No se encontró una cuenta con esta dirección de email.",
    "Invalid email": "Por favor ingresa una dirección de email válida.",
    "Weak password": "La contraseña debe tener al menos 6 caracteres.",
    "Email already registered": "Ya existe una cuenta con este email.",
    "Network error": "Error de conexión de red. Por favor verifica tu conexión a internet.",
    "Auth session missing": "Sesión no encontrada. Por favor inicia sesión de nuevo.",
  }

  // Check for partial matches
  for (const [key, message] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return message
    }
  }

  return "Autenticación fallida. Por favor intenta de nuevo."
}
