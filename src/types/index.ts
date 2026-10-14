// Tipos compartilhados por todo o app.

export type ScreenName = 'home' | 'schedule' | 'details' | 'activity' | 'result';
export type Quality = 'BOA' | 'REGULAR' | 'INSTÁVEL';
export type Activity = 'Videoconferência' | 'Streaming' | 'Jogos online' | 'Navegação' | 'Enviar arquivos';

/** Nível de um indicador técnico (latência, jitter ou perda). */
export type Level = 'low' | 'medium' | 'high';
export type IndicatorKind = 'latency' | 'jitter' | 'loss';

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'parse';

export interface AppState {
  screen: ScreenName;
  selectedTime: string;
  selectedDate: string; // YYYY-MM-DD
  selectedActivity: Activity | null;
  activityTime: string;
  activityDate: string; // YYYY-MM-DD
}

export interface ActivityInfo {
  name: Activity;
  desc: string;
  icon: string;
}

/** Medições previstas. O jitter é opcional porque a API pode não enviá-lo. */
export interface ForecastMetrics {
  latencyMs: number;
  jitterMs?: number;
  lossPct: number;
}

/** Previsão já normalizada, no formato que as telas usam. */
export interface Forecast extends ForecastMetrics {
  quality: Quality;
  /** 'mock' = dados de exemplo (API não conectada). */
  source: 'api' | 'mock';
  modelName?: string;
  probeDistanceKm?: number;
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
