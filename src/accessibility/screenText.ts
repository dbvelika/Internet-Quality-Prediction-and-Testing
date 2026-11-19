// ACESSIBILIDADE — transforma o que a tela mostra em frases curtas e por extenso, boas para traduzir em Libras
// ("49,1 milissegundos" em vez de "49,1 ms"; "quinta-feira, 20 de agosto" em vez de "Qui, 20/08").
import { ABOUT, GLOSSARY, QUALITY_SUMMARY, SUITABILITY } from '../content/texts';
import { summarizeComparison } from '../logic/compare';
import type { ActivityResult, Forecast, ForecastNotes, ModelComparison, TimelineEntry } from '../types';
import { pad } from '../utils/format';

const decimal = (n: number) => n.toFixed(1).replace('.', ',');

/** Instante ISO (UTC) → "quinta-feira, 20 de agosto, às 16:00", no fuso do aparelho. */
export function spokenDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${day}, às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const spokenLatency = (ms: number) => `${GLOSSARY.latency.label}: ${decimal(ms)} milissegundos.`;
const spokenLoss = (pct: number) => `${GLOSSARY.loss.label}: ${decimal(pct)} por cento.`;

/** Tela inicial. */
export function forecastLines(forecast: Forecast, scheduled: boolean): string[] {
  return [
    `${scheduled ? 'Previsão para' : 'Próxima previsão:'} ${spokenDateTime(forecast.predictionFor)}.`,
    `Qualidade esperada: ${forecast.quality.toLowerCase()}.`,
    forecast.advice ?? QUALITY_SUMMARY[forecast.quality],
    spokenLatency(forecast.latencyMs),
    spokenLoss(forecast.lossPct),
  ];
}

/** Resultado de "Planejar uma atividade". */
export function activityLines(result: ActivityResult, activityLabel: string): string[] {
  return [
    `Atividade selecionada: ${activityLabel}.`,
    `Previsão para ${spokenDateTime(result.predictionFor)}.`,
    `Qualidade esperada: ${result.quality.toLowerCase()}.`,
    `${result.suitable ? SUITABILITY.suitable : SUITABILITY.unsuitable}.`,
    result.advice,
    spokenLatency(result.latencyMs),
    spokenLoss(result.lossPct),
    result.notes.disclaimer,
  ];
}

/** "Comparar modelos": o horário, o resumo e uma frase por modelo. */
export function comparisonLines(comparison: ModelComparison, currentModelId: string | null): string[] {
  return [
    `Comparação dos modelos para ${spokenDateTime(comparison.predictionFor)}.`,
    summarizeComparison(comparison.models).headline,
    ...comparison.models.map(
      (m) =>
        `${m.modelName}${m.modelId === currentModelId ? ', modelo em uso' : ''}: conexão ${m.quality.toLowerCase()}. ` +
        `${spokenLatency(m.latencyMs)} ${spokenLoss(m.lossPct)}`,
    ),
  ];
}

/** "Entenda esta previsão". */
export function aboutLines(notes: ForecastNotes | null): string[] {
  return [
    ...(notes
      ? [`${ABOUT.represents}.`, notes.disclaimer, `${ABOUT.privacy}.`, notes.locationPrivacy]
      : []),
    ABOUT.meaning,
    GLOSSARY.latency.hint,
    GLOSSARY.loss.hint,
  ];
}

/** "Próximas previsões": uma frase por horário. */
export function timelineLines(intro: string[], entries: TimelineEntry[] | null): string[] {
  return [
    ...intro,
    ...(entries ?? []).map((e) => `${spokenDateTime(e.predictionFor)}: qualidade ${e.quality.toLowerCase()}.`),
  ];
}
