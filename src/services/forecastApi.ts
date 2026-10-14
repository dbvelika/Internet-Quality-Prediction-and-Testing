// SERVIÇOS — ponto de entrada: as telas pedem a previsão por aqui, sem saber se vem da API ou do exemplo.
import type { Forecast } from '../types';
import { CACHE_TTL_MS, FORECAST_PATH, USE_MOCK } from './config';
import { toForecast } from './forecastAdapter';
import { getJson } from './http';
import { mockForecast } from './mockForecast';

const cache = new Map<string, { at: number; value: Forecast }>();

export async function fetchForecast(date: string, time: string, signal?: AbortSignal): Promise<Forecast> {
  const key = `${date}T${time}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const value = USE_MOCK
    ? await mockForecast(date, time)
    : toForecast(await getJson<unknown>(FORECAST_PATH, { date, time }, signal));

  cache.set(key, { at: Date.now(), value });
  return value;
}
