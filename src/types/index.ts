// Tipos compartilhados por todo o app.

export type ScreenName = 'home' | 'schedule' | 'about' | 'activity' | 'result' | 'models' | 'timeline';

/** Categoria mostrada à pessoa. A API envia GOOD / MODERATE / UNSTABLE (ver services/mappers.ts). */
export type Quality = 'BOA' | 'REGULAR' | 'INSTÁVEL';

/** Códigos de atividade aceitos pela API em POST /activity/check. */
export type Activity = 'VIDEO_CALL' | 'AUDIO_CALL' | 'STREAMING' | 'FILE_UPLOAD' | 'WEB_BROWSING' | 'MESSAGING';

export type IndicatorKind = 'latency' | 'loss';

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse' | 'notFound' | 'noData' | 'noModel';

export type LocationStatus = 'idle' | 'loading' | 'denied' | 'error';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Local usado como referência para achar a probe mais próxima. */
export interface Place extends Coordinates {
  label: string;
  source: 'reference' | 'device';
}

/** Data (YYYY-MM-DD) e horário (HH:MM) escolhidos, no fuso do aparelho. */
export interface Schedule {
  date: string;
  time: string;
}

export interface ActivityInfo {
  code: Activity;
  label: string;
  icon: string;
}

export interface PredictionModel {
  id: string;
  name: string;
  description: string;
  groupName: string;
  algorithm: string;
  version: string;
}

/** Avisos que a API exige mostrar junto da previsão. */
export interface ForecastNotes {
  disclaimer: string;
  locationPrivacy: string;
}

export interface Forecast {
  model: { id: string; name: string };
  /** Instante (ISO, UTC) a que a previsão se refere. */
  predictionFor: string;
  quality: Quality;
  latencyMs: number;
  lossPct: number;
  /** Recomendação enviada pela API. Ausente quando a previsão vem da linha do tempo. */
  advice?: string;
  probe: { id: number; distanceKm: number };
  notes: ForecastNotes;
}

export interface TimelineEntry {
  predictionFor: string;
  quality: Quality;
  latencyMs: number;
  lossPct: number;
}

export interface ActivityResult {
  model: { id: string; name: string };
  activity: Activity;
  suitable: boolean;
  quality: Quality;
  latencyMs: number;
  lossPct: number;
  advice: string;
  notes: ForecastNotes;
}

export interface AppState {
  screen: ScreenName;
  /** null = usar o primeiro modelo ativo da API. */
  modelId: string | null;
  place: Place;
  /** null = próxima previsão disponível. */
  schedule: Schedule | null;
  activity: Activity | null;
  activityWhen: Schedule | null;
}

export interface NavProps {
  go: (screen: ScreenName) => void;
}

export interface ScreenProps extends NavProps {
  state: AppState;
}

export interface EditableScreenProps extends ScreenProps {
  patch: (changes: Partial<AppState>) => void;
}
