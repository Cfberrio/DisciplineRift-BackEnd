/**
 * Utilidad para manejar reintentos y timeouts en llamadas API
 */

export interface RetryOptions {
  maxRetries?: number;
  baseTimeout?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseTimeout: 60000, // 60 segundos
  retryDelay: 2000, // 2 segundos
  onRetry: () => {},
};

/**
 * Ejecuta una función con reintentos automáticos y timeout
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Crear promise con timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Request timeout - La petición tardó demasiado")),
          opts.baseTimeout * (attempt + 1) // Timeout progresivo
        );
      });

      // Ejecutar la función con timeout
      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError?.message || "Error desconocido";

      // Si no es un error que amerite retry, lanzarlo inmediatamente
      if (
        !errorMessage.includes("timeout") &&
        !errorMessage.includes("network") &&
        !errorMessage.includes("fetch") &&
        !errorMessage.includes("Failed to fetch")
      ) {
        throw lastError;
      }

      // Si ya alcanzamos el máximo de reintentos, lanzar el error
      if (attempt >= opts.maxRetries) {
        throw lastError;
      }

      // Notificar del reintento
      opts.onRetry(attempt + 1, lastError);

      // Esperar antes del siguiente intento (delay progresivo)
      await new Promise((resolve) =>
        setTimeout(resolve, opts.retryDelay * (attempt + 1))
      );
    }
  }

  throw lastError || new Error("Error desconocido en withRetry");
}

/**
 * Wrapper para llamadas a Supabase con retry automático
 */
export async function supabaseWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(async () => {
    const { data, error } = await queryFn();

    if (error) {
      throw new Error(error.message || "Error en la petición a la base de datos");
    }

    return data as T;
  }, options);
}




