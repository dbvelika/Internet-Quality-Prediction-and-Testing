// FUNCIONALIDADE — leitura da comparação entre modelos (regras puras, sem tela).
//
// CRÉDITO: a ideia de mostrar "o que cada modelo prevê" para o mesmo horário vem do aplicativo PreditorDeRedes
// (https://github.com/PedroNov4es/PreditorDeRedes), de Pedro Novaes, usada com autorização do autor.
// Aqui ela foi reescrita para a arquitetura do PredictNet, e foi acrescentado um resumo de concordância entre os modelos.
import type { ModelPrediction, Quality } from '../types';

const ORDER: Quality[] = ['BOA', 'REGULAR', 'INSTÁVEL'];

export interface Range {
  min: number;
  max: number;
}

export interface ComparisonSummary {
  /** Todos os modelos classificam a conexão do mesmo jeito. */
  agree: boolean;
  /** Frase curta sobre a concordância; não cita valores (a tela mostra os números). */
  headline: string;
  latency: Range | null;
  loss: Range | null;
}

function joinWithAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

function rangeOf(values: number[]): Range | null {
  return values.length === 0 ? null : { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * Resume a comparação. A API não diz qual modelo é melhor, e este resumo também não: só conta quantos modelos
 * preveem cada categoria e a faixa de valores de latência e perda.
 */
export function summarizeComparison(models: ModelPrediction[]): ComparisonSummary {
  const latency = rangeOf(models.map((m) => m.latencyMs));
  const loss = rangeOf(models.map((m) => m.lossPct));

  if (models.length === 0) return { agree: false, headline: 'Nenhum modelo tem previsão para este horário.', latency, loss };
  if (models.length === 1) {
    return { agree: true, headline: 'Só um modelo tem previsão para este horário.', latency, loss };
  }

  const groups = ORDER.map((quality) => ({ quality, count: models.filter((m) => m.quality === quality).length })).filter(
    (group) => group.count > 0,
  );

  if (groups.length === 1) {
    return {
      agree: true,
      headline: `Os ${models.length} modelos concordam: conexão ${groups[0].quality.toLowerCase()}.`,
      latency,
      loss,
    };
  }

  const parts = groups.map((g) => `${g.count} ${g.count === 1 ? 'prevê' : 'preveem'} ${g.quality.toLowerCase()}`);
  return { agree: false, headline: `Os modelos divergem: ${joinWithAnd(parts)}.`, latency, loss };
}
