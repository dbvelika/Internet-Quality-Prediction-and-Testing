// SERVIÇOS — configuração da API. Documentação: https://internet-quality-api.onrender.com/docs
import type { Place } from '../types';

export const API_BASE_URL = 'https://internet-quality-api.onrender.com';
export const API_PREFIX = '/api/v1';

/** O plano gratuito do Render "dorme" quando fica parado: a primeira chamada pode levar cerca de 1 minuto. */
export const REQUEST_TIMEOUT_MS = 60000;

export const CACHE_TTL_MS = 5 * 60 * 1000;
export const MODELS_TTL_MS = 30 * 60 * 1000;

/** Quantas previsões a tela "Próximas previsões" pede (a API aceita até 100). */
export const TIMELINE_LIMIT = 24;

/** Região usada até a pessoa autorizar a localização do aparelho. */
export const DEFAULT_PLACE: Place = {
  latitude: -23.55,
  longitude: -46.63,
  label: 'São Paulo (referência)',
  source: 'reference',
};
