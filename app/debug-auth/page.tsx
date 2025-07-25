"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugAuthPage() {
  const [session, setSession] = useState<any>(null)
  const [adminData, setAdminData] = useState<any>(null)
  const [allAdmins, setAllAdmins] = useState<any[]>([])
  const [errors, setErrors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    setIsLoading(true)
    const newErrors: any[] = []

    try {
      // 1. Check current session
      console.log("🔍 Verificando sesión actual...")
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        newErrors.push({ type: "session", error: sessionError })
        console.error("❌ Error de sesión:", sessionError)
      } else {
        console.log("✅ Sesión obtenida:", currentSession?.user?.email || "No hay sesión")
        setSession(currentSession)
      }

      // 2. Check admin table structure and content
      console.log("🔍 Verificando tabla admin...")
      const { data: admins, error: adminTableError } = await supabase
        .from("admin")
        .select("*")
        
      if (adminTableError) {
        newErrors.push({ type: "admin_table", error: adminTableError })
        console.error("❌ Error en tabla admin:", adminTableError)
      } else {
        console.log("✅ Tabla admin accesible, registros encontrados:", admins?.length || 0)
        setAllAdmins(admins || [])
      }

      // 3. Check if current user is admin
      if (currentSession?.user?.email) {
        console.log("🔍 Verificando si el usuario actual es admin...")
        const { data: currentAdminData, error: currentAdminError } = await supabase
          .from("admin")
          .select("*")
          .eq("email", currentSession.user.email)
          .single()

        if (currentAdminError) {
          newErrors.push({ type: "current_admin", error: currentAdminError })
          console.error("❌ Error verificando admin actual:", currentAdminError)
        } else {
          console.log("✅ Usuario actual es admin:", !!currentAdminData)
          setAdminData(currentAdminData)
        }
      }

    } catch (error) {
      newErrors.push({ type: "general", error })
      console.error("❌ Error general:", error)
    }

    setErrors(newErrors)
    setIsLoading(false)
  }

  const createTestAdmin = async () => {
    const email = prompt("Ingresa el email del admin:")
    if (!email) return

    try {
      console.log("Creando admin de prueba...")
      const { data, error } = await supabase
        .from("admin")
        .insert([
          {
            email: email,
            name: "Administrador de Prueba",
            role: "admin"
          }
        ])
        .select()

      if (error) {
        alert(`Error: ${error.message}`)
        console.error("Error creando admin:", error)
      } else {
        alert("Admin creado exitosamente")
        checkAuthStatus()
      }
    } catch (error) {
      alert(`Error: ${error}`)
      console.error("Error:", error)
    }
  }

  const loginAsAdmin = async () => {
    const email = prompt("Email:")
    const password = prompt("Contraseña:")
    
    if (!email || !password) return

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        alert(`Error de login: ${error.message}`)
      } else {
        alert("Login exitoso")
        checkAuthStatus()
      }
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    checkAuthStatus()
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🔧 Diagnóstico de Autenticación</h1>
        <div className="flex gap-2">
          <Button onClick={checkAuthStatus} disabled={isLoading}>
            🔄 Refrescar
          </Button>
          <Button onClick={loginAsAdmin} variant="outline">
            🔑 Login Manual
          </Button>
          {session && (
            <Button onClick={signOut} variant="destructive">
              🚪 Cerrar Sesión
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sesión Actual */}
        <Card>
          <CardHeader>
            <CardTitle>🧑‍💻 Sesión Actual</CardTitle>
            <CardDescription>Estado de autenticación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Estado:</strong> {session ? "✅ Autenticado" : "❌ No autenticado"}
            </div>
            
            {session && (
              <>
                <div>
                  <strong>Email:</strong> {session.user?.email}
                </div>
                <div>
                  <strong>ID:</strong> {session.user?.id}
                </div>
                <div>
                  <strong>Es Admin:</strong> {adminData ? "✅ Sí" : "❌ No"}
                </div>
              </>
            )}

            {!session && (
              <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                <strong>⚠️ No hay sesión activa</strong>
                <br />
                <small>Necesitas hacer login primero</small>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla Admin */}
        <Card>
          <CardHeader>
            <CardTitle>👥 Tabla Admin</CardTitle>
            <CardDescription>Usuarios administradores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Admins registrados:</strong> {allAdmins.length}
            </div>
            
            {allAdmins.length === 0 && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <strong>❌ No hay administradores registrados</strong>
                <br />
                <small>Esto explica por qué no puedes acceder</small>
              </div>
            )}

            {allAdmins.length > 0 && (
              <div>
                <strong>Lista de admins:</strong>
                <div className="mt-2 space-y-2">
                  {allAdmins.map((admin, index) => (
                    <div key={index} className="p-2 bg-gray-100 rounded text-sm">
                      <div><strong>Email:</strong> {admin.email}</div>
                      <div><strong>Nombre:</strong> {admin.name}</div>
                      <div><strong>Rol:</strong> {admin.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={createTestAdmin} className="w-full">
              ➕ Crear Admin de Prueba
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Errores */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🚨 Errores Detectados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errors.map((err, index) => (
                <div key={index} className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <strong>Tipo:</strong> {err.type}
                  <br />
                  <strong>Error:</strong> {err.error?.message || String(err.error)}
                  <pre className="text-xs mt-2 overflow-auto">
                    {JSON.stringify(err.error, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información Técnica */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Información Técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Variables de entorno:</strong>
              <div className="text-sm text-gray-600 mt-1">
                SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Configurada" : "❌ No configurada"}
              </div>
              <div className="text-sm text-gray-600">
                SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ No configurada"}
              </div>
            </div>
            
            <div>
              <strong>Datos completos de sesión:</strong>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            <div>
              <strong>Datos de admin actual:</strong>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
                {JSON.stringify(adminData, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => window.location.href = '/login'} 
              variant="outline"
            >
              🔑 Ir al Login
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
            >
              🏠 Ir al Dashboard
            </Button>
            <Button 
              onClick={() => window.location.href = '/servicios'} 
              variant="outline"
            >
              🛠️ Ir a Servicios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 