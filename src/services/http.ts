// SERVIÇOS — cliente HTTP genérico, com tempo limite e erros tipados.
import type { ApiErrorKind } from '../types';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export async function getJson<T>(path: string, params: Record<string, string> = {}, signal?: AbortSignal): Promise<T> {
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const url = `${API_BASE_URL}${path}${query ? `?${query}` : ''}`;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new ApiError('http', `HTTP ${response.status}`, response.status);
    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError('parse', 'Resposta não é um JSON válido.');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError('timeout', 'Tempo esgotado.');
    if (signal?.aborted) throw error; // cancelado pela tela (ela já saiu); ninguém vai ler este erro
    throw new ApiError('network', 'Sem conexão com o servidor.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
