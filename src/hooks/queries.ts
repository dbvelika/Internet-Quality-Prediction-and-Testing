// FUNCIONALIDADE — uma consulta por tipo de dado da API, no formato que as telas usam.
import { toUtcIso } from '../logic/schedule';
import { loadActivityCheck, loadForecast, loadModels, loadTimeline } from '../services/forecastService';
import type { Activity, Place, Schedule } from '../types';
import { useAsync } from './useAsync';

export function useModels() {
  return useAsync((signal) => loadModels(signal), []);
}

/** `schedule` nulo = próxima previsão disponível. */
export function useForecast(modelId: string | null, place: Place, schedule: Schedule | null) {
  const when = schedule ? toUtcIso(schedule) : null;
  return useAsync((signal) => loadForecast({ modelId, place, when }, signal), [
    modelId,
    place.latitude,
    place.longitude,
    when,
  ]);
}

export function useTimeline(modelId: string | null, place: Place) {
  return useAsync((signal) => loadTimeline({ modelId, place }, signal), [modelId, place.latitude, place.longitude]);
}

export function useActivityCheck(modelId: string | null, place: Place, activity: Activity, schedule: Schedule) {
  const when = toUtcIso(schedule);
  return useAsync((signal) => loadActivityCheck({ modelId, place, when, activity }, signal), [
    modelId,
    place.latitude,
    place.longitude,
    activity,
    when,
  ]);
}
