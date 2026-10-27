// SERVIÇOS — ponto de entrada das telas: combina os endpoints e guarda respostas em cache.
import { pickModel } from '../logic/models';
import type { Activity, ActivityResult, Coordinates, Forecast, PredictionModel, TimelineEntry } from '../types';
import { checkActivity, getNearby, getTimeline, listModels } from './api';
import { memo } from './cache';
import { CACHE_TTL_MS, MODELS_TTL_MS, TIMELINE_LIMIT } from './config';
import { ApiError } from './http';

export function loadModels(signal?: AbortSignal): Promise<PredictionModel[]> {
  return memo('models', MODELS_TTL_MS, () => listModels(signal));
}

async function resolveModel(chosenId: string | null, signal?: AbortSignal): Promise<PredictionModel> {
  const model = pickModel(await loadModels(signal), chosenId);
  if (!model) throw new ApiError('noModel', 'Nenhum modelo ativo.');
  return model;
}

function loadNearest(model: PredictionModel, place: Coordinates, signal?: AbortSignal): Promise<Forecast> {
  const key = `nearby|${model.id}|${place.latitude}|${place.longitude}`;
  return memo(key, CACHE_TTL_MS, () => getNearby({ place, modelId: model.id }, signal));
}

/**
 * Previsão da região. Sem `when`, é a próxima disponível (sempre existe: a API devolve a última linha
 * se todas já passaram). Com `when` (ISO, UTC), é a primeira previsão naquele horário ou depois dele.
 */
export async function loadForecast(
  args: { modelId: string | null; place: Coordinates; when: string | null },
  signal?: AbortSignal,
): Promise<Forecast> {
  const model = await resolveModel(args.modelId, signal);
  const nearest = await loadNearest(model, args.place, signal);
  if (!args.when) return nearest;

  const [entry] = await getTimeline({ probeId: nearest.probe.id, modelId: model.id, from: args.when, limit: 1 }, signal);
  if (!entry) throw new ApiError('noData', 'Sem previsão para este horário.');
  // A linha do tempo não traz recomendação: `advice` fica vazio e a tela usa o texto da categoria.
  return {
    ...nearest,
    predictionFor: entry.predictionFor,
    quality: entry.quality,
    latencyMs: entry.latencyMs,
    lossPct: entry.lossPct,
    advice: undefined,
  };
}

export async function loadTimeline(
  args: { modelId: string | null; place: Coordinates },
  signal?: AbortSignal,
): Promise<TimelineEntry[]> {
  const model = await resolveModel(args.modelId, signal);
  const nearest = await loadNearest(model, args.place, signal);
  return getTimeline(
    { probeId: nearest.probe.id, modelId: model.id, from: timelineStart(nearest.predictionFor), limit: TIMELINE_LIMIT },
    signal,
  );
}

/**
 * Quando a "próxima" previsão já passou, a API devolve a última linha que tem — ou seja, os dados são um período
 * fixo no passado. Começar nela mostraria uma única previsão; por isso a lista começa um dia antes (24 linhas
 * horárias cobrem esse dia inteiro).
 */
function timelineStart(predictionFor: string): string {
  const instant = new Date(predictionFor).getTime();
  if (Number.isNaN(instant) || instant >= Date.now()) return predictionFor;
  return new Date(instant - (TIMELINE_LIMIT - 1) * 3600_000).toISOString();
}

export async function loadActivityCheck(
  args: { modelId: string | null; place: Coordinates; when: string; activity: Activity },
  signal?: AbortSignal,
): Promise<ActivityResult> {
  const model = await resolveModel(args.modelId, signal);
  return checkActivity({ modelId: model.id, place: args.place, dateTime: args.when, activity: args.activity }, signal);
}
