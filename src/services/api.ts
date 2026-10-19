// SERVIÇOS — uma função por endpoint da API usado pelo app.
import type { Activity, ActivityResult, Coordinates, Forecast, PredictionModel, TimelineEntry } from '../types';
import type {
  ApiActivityCheckRequest,
  ApiActivityCheckResponse,
  ApiModelsResponse,
  ApiNearbyResponse,
  ApiTimelineResponse,
} from './dto';
import { request } from './http';
import { parse, toActivityResult, toForecast, toModel, toTimelineEntry } from './mappers';

/** GET /models — modelos ativos, em ordem de nome. */
export async function listModels(signal?: AbortSignal): Promise<PredictionModel[]> {
  const raw = await request<ApiModelsResponse>('GET', '/models', { signal });
  return parse(() => raw.items.map(toModel));
}

/** GET /forecasts/nearby — próxima previsão da probe mais próxima que tenha dados do modelo. */
export async function getNearby(args: { place: Coordinates; modelId: string }, signal?: AbortSignal): Promise<Forecast> {
  const raw = await request<ApiNearbyResponse>('GET', '/forecasts/nearby', {
    query: { lat: args.place.latitude, lon: args.place.longitude, model_id: args.modelId },
    signal,
  });
  return parse(() => toForecast(raw));
}

/** GET /forecasts/probes/{id}/timeline — previsões em ordem de horário. `from` é um instante ISO (UTC), inclusivo. */
export async function getTimeline(
  args: { probeId: number; modelId: string; from?: string; limit?: number },
  signal?: AbortSignal,
): Promise<TimelineEntry[]> {
  const raw = await request<ApiTimelineResponse>('GET', `/forecasts/probes/${args.probeId}/timeline`, {
    query: { model_id: args.modelId, from: args.from, limit: args.limit },
    signal,
  });
  return parse(() => raw.items.map(toTimelineEntry));
}

/** POST /activity/check — diz se a atividade parece adequada naquele instante. */
export async function checkActivity(
  args: { modelId: string; place: Coordinates; dateTime: string; activity: Activity },
  signal?: AbortSignal,
): Promise<ActivityResult> {
  const body: ApiActivityCheckRequest = {
    modelId: args.modelId,
    latitude: args.place.latitude,
    longitude: args.place.longitude,
    dateTime: args.dateTime,
    activity: args.activity,
  };
  const raw = await request<ApiActivityCheckResponse>('POST', '/activity/check', { body, signal });
  return parse(() => toActivityResult(raw, args.activity));
}
