// DADOS FIXOS — atividades e horários rápidos.
import type { Activity, ActivityInfo } from '../types';
import { ACTIVITY_ICON } from './icons';

const DESCRIPTIONS: Record<Activity, string> = {
  'Videoconferência': 'Chamadas de vídeo',
  Streaming: 'Filmes e séries',
  'Jogos online': 'Games em rede',
  'Navegação': 'Sites e redes sociais',
  'Enviar arquivos': 'Upload de documentos',
};

export const ACTIVITIES: ActivityInfo[] = (Object.keys(DESCRIPTIONS) as Activity[]).map((name) => ({
  name,
  desc: DESCRIPTIONS[name],
  icon: ACTIVITY_ICON[name],
}));

export const QUICK_TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00'];
