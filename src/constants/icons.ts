// ÍCONES — todos os emojis/símbolos do app ficam aqui.
// Para trocar por uma biblioteca de ícones no futuro, basta mexer neste arquivo e no IconBox.
import type { Activity, Quality } from '../types';

export const ICONS = {
  logo: '⚡',
  calendar: '📅',
  clock: '🕐',
  pin: '📍',
  back: '‹',
  check: '✓',
} as const;

export const QUALITY_ICON: Record<Quality, string> = {
  BOA: '✓',
  REGULAR: '⚠',
  'INSTÁVEL': '✕',
};

export const ACTIVITY_ICON: Record<Activity, string> = {
  VIDEO_CALL: '📹',
  AUDIO_CALL: '🎧',
  STREAMING: '🎬',
  FILE_UPLOAD: '📁',
  WEB_BROWSING: '🌐',
  MESSAGING: '💬',
};
