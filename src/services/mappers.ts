// SERVIÇOS — traduz as respostas da API para os tipos do app e valida o que chega.
import type { Activity, ActivityResult, Forecast, ForecastNotes, PredictionModel, Quality, TimelineEntry } from '../types';
import type {
  ApiActivityCheckResponse,
  ApiModelListItem,
  ApiNearbyResponse,
  ApiNotes,
  ApiTimelineItem,
} from './dto';
import { ApiError } from './http';

const fail = (what: string): never => {
  throw new ApiError('parse', `Campo inválido na resposta: ${what}`);
};

const text = (value: unknown, what: string): string => (typeof value === 'string' && value !== '' ? value : fail(what));
const optionalText = (value: unknown): string => (typeof value === 'string' ? value : '');
const num = (value: unknown, what: string): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fail(what);

/** Executa a tradução e garante que qualquer falha vire ApiError('parse'). */
export function parse<T>(build: () => T): T {
  try {
    return build();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('parse', 'Resposta em formato inesperado.');
  }
}

export function toQuality(value: unknown): Quality {
  switch (value) {
    case 'GOOD':
      return 'BOA';
    case 'MODERATE':
      return 'REGULAR';
    case 'UNSTABLE':
      return 'INSTÁVEL';
    default:
      return fail('quality');
  }
}

function toNotes(meta: ApiNotes): ForecastNotes {
  return {
    disclaimer: text(meta.disclaimer, 'metadata.disclaimer'),
    locationPrivacy: text(meta.locationPrivacy, 'metadata.locationPrivacy'),
  };
}

export function toModel(item: ApiModelListItem): PredictionModel {
  return {
    id: text(item.id, 'id'),
    name: text(item.name, 'name'),
    description: optionalText(item.description),
    groupName: optionalText(item.groupName),
    algorithm: optionalText(item.algorithm),
    version: optionalText(item.version),
  };
}

export function toForecast(raw: ApiNearbyResponse): Forecast {
  return {
    model: { id: text(raw.model.id, 'model.id'), name: text(raw.model.name, 'model.name') },
    predictionFor: text(raw.prediction.predictionFor, 'prediction.predictionFor'),
    quality: toQuality(raw.assessment.quality),
    latencyMs: num(raw.prediction.predictedAvgRttMs, 'prediction.predictedAvgRttMs'),
    lossPct: num(raw.prediction.predictedPacketLossPct, 'prediction.predictedPacketLossPct'),
    advice: optionalText(raw.recommendation?.message) || undefined,
    probe: {
      id: num(raw.matchedProbe.probeId, 'matchedProbe.probeId'),
      distanceKm: num(raw.matchedProbe.distanceKm, 'matchedProbe.distanceKm'),
    },
    notes: toNotes(raw.metadata),
  };
}

export function toTimelineEntry(item: ApiTimelineItem): TimelineEntry {
  return {
    predictionFor: text(item.predictionFor, 'predictionFor'),
    quality: toQuality(item.quality),
    latencyMs: num(item.predictedAvgRttMs, 'predictedAvgRttMs'),
    lossPct: num(item.predictedPacketLossPct, 'predictedPacketLossPct'),
  };
}

export function toActivityResult(raw: ApiActivityCheckResponse, activity: Activity): ActivityResult {
  return {
    model: { id: text(raw.model.id, 'model.id'), name: text(raw.model.name, 'model.name') },
    activity,
    suitable: typeof raw.suitable === 'boolean' ? raw.suitable : fail('suitable'),
    quality: toQuality(raw.forecast.quality),
    latencyMs: num(raw.forecast.predictedAvgRttMs, 'forecast.predictedAvgRttMs'),
    lossPct: num(raw.forecast.predictedPacketLossPct, 'forecast.predictedPacketLossPct'),
    advice: text(raw.recommendation.message, 'recommendation.message'),
    notes: toNotes(raw.metadata),
  };
}
