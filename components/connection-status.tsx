"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const [status, setStatus] = useState<
    "checking" | "connected" | "error" | "timeout"
  >("checking");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setStatus("checking");
      setError("");

      // Test connection with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 5000);
      });

      const testPromise = supabase.from("school").select("count").limit(1);

      await Promise.race([testPromise, timeoutPromise]);
      setStatus("connected");
    } catch (err) {
      console.error("Connection test failed:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  if (status === "checking") {
    return (
      <Alert className="mb-4">
        <Wifi className="h-4 w-4 animate-pulse" />
        <AlertDescription>
          Verificando conexión con la base de datos...
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive" className="mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Error de conexión: {error}
          <button
            onClick={checkConnection}
            className="ml-2 underline hover:no-underline"
          >
            Reintentar
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "connected") {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Conexión establecida correctamente
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
