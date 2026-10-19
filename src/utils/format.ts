// FUNÇÕES AUXILIARES — datas, horários e formatação de números.

export const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function nextDays(n = 7): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const text = new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Instante ISO (UTC) → "Qui, 20/08 às 16:00", no fuso do aparelho. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const isValidTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

/** Transforma "2030" em "20:30" enquanto a pessoa digita. */
export function maskTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export const formatMs = (ms: number) => `${ms.toFixed(1).replace('.', ',')} ms`;

export const formatPercent = (pct: number) => `${pct.toFixed(1).replace('.', ',')}%`;

export const formatKm = (km: number) => `${km.toFixed(1).replace('.', ',')} km`;
