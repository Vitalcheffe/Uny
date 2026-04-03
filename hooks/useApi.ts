import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showErrorToast?: boolean;
  retryCount?: number;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
  reset: () => void;
}

/**
 * 🔄 useApi - Hook avec retry automatique et gestion d'erreurs
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const {
    onSuccess,
    onError,
    showErrorToast = true,
    retryCount = 3,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < retryCount) {
      try {
        attempt++;
        const result = await fetchFn();
        setData(result);
        onSuccess?.(result);
        setLoading(false);
        return;
      } catch (err) {
        lastError = err as Error;
        console.warn(`🔄 Retry ${attempt}/${retryCount}:`, lastError.message);
        
        if (attempt < retryCount) {
          // Attente exponentielle: 1s, 2s, 4s
          await new Promise(r => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }

    // Tous les essais ont échoué
    setError(lastError!);
    onError?.(lastError!);
    
    if (showErrorToast) {
      toast.error(lastError?.message || 'Une erreur est survenue');
    }
    
    setLoading(false);
  }, [fetchFn, onSuccess, onError, retryCount, showErrorToast]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/**
 * 📤 useMutation - Hook pour les actions (POST/PUT/DELETE)
 */
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiOptions<TData> = {}
) {
  const {
    onSuccess,
    onError,
    showErrorToast = true,
  } = options;

  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);
      onSuccess?.(result);
      setLoading(false);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      
      if (showErrorToast) {
        toast.error(error.message || 'Une erreur est survenue');
      }
      
      setLoading(false);
      throw error;
    }
  }, [mutationFn, onSuccess, onError, showErrorToast]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, mutate, reset };
}

/**
 * 📥 useQuery - Hook pour les requêtes GET
 */
export function useQuery<TData>(
  key: string[],
  fetchFn: () => Promise<TData>,
  options: UseApiOptions<TData> = {}
) {
  const { data, loading, error, execute, reset } = useApi(fetchFn, options);
  
  // Refetch function
  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return { data, loading, error, refetch, reset };
}