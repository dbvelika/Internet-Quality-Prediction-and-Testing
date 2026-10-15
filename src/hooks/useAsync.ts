// FUNCIONALIDADE — executa uma tarefa assíncrona e informa carregando, erro e resultado.
import { useCallback, useEffect, useState } from 'react';
import { ERROR_TEXT } from '../content/texts';
import { ApiError } from '../services/http';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

function describeError(error: unknown): string {
  return error instanceof ApiError ? ERROR_TEXT[error.kind] : ERROR_TEXT.unknown;
}

/** A tarefa roda de novo sempre que algum item de `deps` mudar (use só valores simples) ou quando `reload` for chamado. */
export function useAsync<T>(task: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState({ data: null, loading: true, error: null });

    task(controller.signal)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, loading: false, error: describeError(error) });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, reload };
}
