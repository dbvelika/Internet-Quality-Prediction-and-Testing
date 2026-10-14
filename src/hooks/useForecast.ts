// FUNCIONALIDADE — busca a previsão de uma data/horário e informa carregando, erro e resultado.
import { useCallback, useEffect, useState } from 'react';
import { ERROR_TEXT } from '../content/texts';
import { fetchForecast } from '../services/forecastApi';
import { ApiError } from '../services/http';
import type { Forecast } from '../types';

interface ForecastState {
  forecast: Forecast | null;
  loading: boolean;
  error: string | null;
}

function describeError(error: unknown): string {
  return error instanceof ApiError ? ERROR_TEXT[error.kind] : ERROR_TEXT.unknown;
}

export function useForecast(date: string, time: string) {
  const [state, setState] = useState<ForecastState>({ forecast: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState({ forecast: null, loading: true, error: null });

    fetchForecast(date, time, controller.signal)
      .then((forecast) => {
        if (active) setState({ forecast, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ forecast: null, loading: false, error: describeError(error) });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [date, time, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, reload };
}
