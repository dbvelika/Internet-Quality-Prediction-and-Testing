// DESIGN — paleta de cores e cores por qualidade.
import type { Quality } from '../types';

export const colors = {
  white: '#ffffff',
  blue: '#2563eb',
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue800: '#1e40af',
  blue900: '#1e3a8a',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  green: '#15803d',
  amber: '#b45309',
  red: '#b91c1c',
  greenBg: '#f0fdf4',
  amberBg: '#fffbeb',
  redBg: '#fef2f2',
} as const;

interface QualityColors {
  fg: string;
  bg: string;
  border: string;
  badgeBg: string;
  badgeFg: string;
}

export const qualityColors: Record<Quality, QualityColors> = {
  BOA: { fg: colors.green, bg: colors.greenBg, border: '#bbf7d0', badgeBg: '#dcfce7', badgeFg: '#166534' },
  REGULAR: { fg: colors.amber, bg: colors.amberBg, border: '#fde68a', badgeBg: '#fef3c7', badgeFg: '#92400e' },
  'INSTÁVEL': { fg: colors.red, bg: colors.redBg, border: '#fecaca', badgeBg: '#fee2e2', badgeFg: '#991b1b' },
};
