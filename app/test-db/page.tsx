"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

export default function TestDB() {
  const [connection, setConnection] = useState<string>("Verificando...")
  const [schools, setSchools] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      console.log("Probando conexión a Supabase...")
      
      // Test 1: Basic connection
      const { data: schoolsData, error: schoolsError } = await supabase
        .from("school")
        .select("*")
        .limit(5)

      if (schoolsError) {
        console.error("Error fetching schools:", schoolsError)
        setConnection(`Error: ${schoolsError.message}`)
        setError(schoolsError.message)
        return
      }

      console.log("Schools data:", schoolsData)
      setSchools(schoolsData || [])
      setConnection("✅ Conexión exitosa")

      // Test 2: Check teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("team")
        .select("*")
        .limit(3)

      if (teamsError) {
        console.error("Error fetching teams:", teamsError)
      } else {
        console.log("Teams data:", teamsData)
      }

    } catch (err) {
      console.error("Error general:", err)
      setConnection(`Error general: ${err}`)
      setError(String(err))
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Conectividad a Base de Datos</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Estado de Conexión:</strong> {connection}
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div>
          <strong>Escuelas encontradas:</strong> {schools.length}
        </div>

        {schools.length > 0 && (
          <div>
            <h3 className="font-bold mb-2">Datos de Escuelas:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(schools, null, 2)}
            </pre>
          </div>
        )}

        <button 
          onClick={testConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Probar Conexión de Nuevo
        </button>
      </div>
    </div>
  )
} 