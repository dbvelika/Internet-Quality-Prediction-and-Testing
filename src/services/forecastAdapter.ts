// SERVIÇOS — traduz a resposta da API para o tipo Forecast usado pelas telas.
//
// ⚠ PONTO ÚNICO DE AJUSTE: os nomes dos campos abaixo (latency_ms, loss_pct...) são PROVISÓRIOS.
// Quando você tiver o JSON real da API, só este arquivo muda; telas e regras continuam iguais.
import type { Forecast, ForecastMetrics, Quality } from '../types';
import { deriveQuality } from '../logic/rules';
import { ApiError } from './http';

interface ApiForecastResponse {
  quality?: string;
  latency_ms?: number;
  jitter_ms?: number;
  loss_pct?: number;
  model?: string;
  probe_distance_km?: number;
}

function parseQuality(value?: string): Quality | null {
  const v = value?.trim().toLowerCase();
  if (v === 'boa' || v === 'good') return 'BOA';
  if (v === 'regular' || v === 'moderada' || v === 'moderate') return 'REGULAR';
  if (v === 'instável' || v === 'instavel' || v === 'ruim' || v === 'poor') return 'INSTÁVEL';
  return null;
}

export function toForecast(raw: unknown): Forecast {
  const r = (raw ?? {}) as ApiForecastResponse;
  if (typeof r.latency_ms !== 'number' || typeof r.loss_pct !== 'number') {
    throw new ApiError('parse', 'Resposta da API sem latência ou perda de pacotes.');
  }
  const metrics: ForecastMetrics = {
    latencyMs: r.latency_ms,
    jitterMs: typeof r.jitter_ms === 'number' ? r.jitter_ms : undefined,
    lossPct: r.loss_pct,
  };
  return {
    ...metrics,
    quality: parseQuality(r.quality) ?? deriveQuality(metrics),
    source: 'api',
    modelName: r.model,
    probeDistanceKm: r.probe_distance_km,
  };
}
