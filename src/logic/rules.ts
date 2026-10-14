// FUNCIONALIDADE — regras que transformam medições em níveis e qualidade.
//
// Limiares do material de apoio da disciplina de Redes (Latência/Jitter/Pacotes e Distância das rotas):
//   latência:  até 50 ms baixa · 51–100 ms média · acima de 100 ms alta
//   jitter:    abaixo de 20 ms baixo · 20–50 ms médio · acima de 50 ms alto
//   perda:     abaixo de 0,5% baixa · 0,5–2% média · acima de 2% alta
// Observação do material: em rotas longas o RTT bruto sozinho não diz se a rota está ruim;
// o ideal é comparar com o baseline (média ± desvio padrão). Se a API enviar a qualidade
// já calculada, ela tem prioridade (ver services/forecastAdapter.ts).
import { ACTIVITIES } from '../constants/activities';
import type { Activity, ForecastMetrics, IndicatorKind, Level, Quality } from '../types';
import { formatMs, formatPercent } from '../utils/format';

export const latencyLevel = (ms: number): Level => (ms <= 50 ? 'low' : ms <= 100 ? 'medium' : 'high');
export const jitterLevel = (ms: number): Level => (ms < 20 ? 'low' : ms <= 50 ? 'medium' : 'high');
export const lossLevel = (pct: number): Level => (pct < 0.5 ? 'low' : pct <= 2 ? 'medium' : 'high');

export interface IndicatorRowData {
  kind: IndicatorKind;
  level: Level;
  measure: string;
}

/** Linhas de indicadores prontas para a tela. O jitter só aparece se existir. */
export function getIndicatorRows(m: ForecastMetrics): IndicatorRowData[] {
  const rows: IndicatorRowData[] = [{ kind: 'latency', level: latencyLevel(m.latencyMs), measure: formatMs(m.latencyMs) }];
  if (m.jitterMs !== undefined) {
    rows.push({ kind: 'jitter', level: jitterLevel(m.jitterMs), measure: formatMs(m.jitterMs) });
  }
  rows.push({ kind: 'loss', level: lossLevel(m.lossPct), measure: formatPercent(m.lossPct) });
  return rows;
}

const RANK: Record<Level, number> = { low: 0, medium: 1, high: 2 };
const QUALITY_BY_RANK: Quality[] = ['BOA', 'REGULAR', 'INSTÁVEL'];

/** A qualidade geral é a do pior indicador. */
export function deriveQuality(m: ForecastMetrics): Quality {
  const worst = Math.max(...getIndicatorRows(m).map((r) => RANK[r.level]));
  return QUALITY_BY_RANK[worst];
}

export function getAvailableActivities(q: Quality): Activity[] {
  if (q === 'BOA') return ACTIVITIES.map((a) => a.name);
  if (q === 'REGULAR') return ['Navegação', 'Enviar arquivos', 'Streaming'];
  return ['Navegação'];
}

const DEMANDING: Activity[] = ['Videoconferência', 'Jogos online'];

export const isDemanding = (activity: Activity) => DEMANDING.includes(activity);

/** Atividades que exigem mais da rede ficam um nível pior quando a conexão está REGULAR. */
export function getActivityQuality(activity: Activity, base: Quality): Quality {
  if (base === 'REGULAR' && isDemanding(activity)) return 'INSTÁVEL';
  return base;
}
