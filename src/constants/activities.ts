// DADOS FIXOS — atividades (os códigos são os da API; os nomes são os do protótipo) e horários rápidos.
import type { Activity, ActivityInfo } from '../types';
import { ACTIVITY_ICON } from './icons';

const LABELS: Record<Activity, string> = {
  VIDEO_CALL: 'Chamada de vídeo',
  AUDIO_CALL: 'Chamada de áudio',
  STREAMING: 'Assistir streaming',
  FILE_UPLOAD: 'Enviar arquivo',
  WEB_BROWSING: 'Navegar na web',
  MESSAGING: 'Enviar mensagens',
};

export const ACTIVITIES: ActivityInfo[] = (Object.keys(LABELS) as Activity[]).map((code) => ({
  code,
  label: LABELS[code],
  icon: ACTIVITY_ICON[code],
}));

export const activityLabel = (code: Activity) => LABELS[code];

export const QUICK_TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00'];
