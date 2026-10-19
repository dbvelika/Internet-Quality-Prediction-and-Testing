// SERVIÇOS — cliente HTTP genérico, com tempo limite, corpo JSON e erros tipados.
import type { ApiErrorKind } from '../types';
import { API_BASE_URL, API_PREFIX, REQUEST_TIMEOUT_MS } from './config';

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

type Query = Record<string, string | number | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, query: Query = {}): string {
  const qs = Object.entries(query)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return `${API_BASE_URL}${API_PREFIX}${path}${qs ? `?${qs}` : ''}`;
}

export async function request<T>(method: 'GET' | 'POST', path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, signal } = options;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel);

  try {
    const hasBody = body !== undefined;
    const response = await fetch(buildUrl(path, query), {
      method,
      headers: hasBody ? { Accept: 'application/json', 'Content-Type': 'application/json' } : { Accept: 'application/json' },
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(response.status === 404 ? 'notFound' : 'http', `HTTP ${response.status}`, response.status);
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError('parse', 'Resposta não é um JSON válido.');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError('timeout', 'Tempo esgotado.');
    if (signal?.aborted) throw error; // a tela já saiu; ninguém vai ler este erro
    throw new ApiError('network', 'Sem conexão com o servidor.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
