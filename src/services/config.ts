// SERVIÇOS — configuração da API. É o único arquivo que você precisa editar para conectar.

/** URL base da API, sem barra no final. Exemplo: 'https://minha-api.exemplo.com'. Vazio = dados de exemplo. */
export const API_BASE_URL: string = '';

/** ⚠ Caminho do endpoint de previsão. Ajuste conforme a documentação da API. */
export const FORECAST_PATH: string = '/forecast';

export const USE_MOCK: boolean = API_BASE_URL === '';
export const REQUEST_TIMEOUT_MS = 10000;
export const CACHE_TTL_MS = 5 * 60 * 1000;
