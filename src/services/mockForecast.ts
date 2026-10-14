// SERVIÇOS — dados de exemplo, usados enquanto API_BASE_URL estiver vazio.
// Pode ser apagado quando a API real estiver funcionando.
import type { Forecast, ForecastMetrics, Quality } from '../types';

const QUALITY_BY_TIME: Record<string, Quality> = {
  '18:00': 'REGULAR',
  '19:00': 'BOA',
  '20:00': 'BOA',
  '21:00': 'REGULAR',
  '22:00': 'INSTÁVEL',
};

const SAMPLE_METRICS: Record<Quality, ForecastMetrics> = {
  BOA: { latencyMs: 18, jitterMs: 4, lossPct: 0 },
  REGULAR: { latencyMs: 72, jitterMs: 28, lossPct: 1.2 },
  'INSTÁVEL': { latencyMs: 140, jitterMs: 65, lossPct: 3.4 },
};

export async function mockForecast(_date: string, time: string): Promise<Forecast> {
  await new Promise<void>((resolve) => setTimeout(resolve, 350));
  const quality = QUALITY_BY_TIME[time] ?? 'BOA';
  return { quality, ...SAMPLE_METRICS[quality], source: 'mock' };
}
