// FUNCIONALIDADE — conversões entre o que a pessoa escolhe (horário local) e o que a API usa (UTC).
import type { Schedule } from '../types';
import { pad, toISO } from '../utils/format';

/** Data + horário locais → instante ISO em UTC (ex.: "2026-08-20T19:00:00.000Z"). */
export function toUtcIso(s: Schedule): string {
  const [y, m, d] = s.date.split('-').map(Number);
  const [hh, mm] = s.time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}

/** Instante ISO (UTC) → data + horário locais. */
export function scheduleFromIso(iso: string): Schedule {
  const d = new Date(iso);
  return { date: toISO(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/** Início da próxima hora cheia, para sugerir um horário. */
export function nextHour(): Schedule {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return scheduleFromIso(d.toISOString());
}
