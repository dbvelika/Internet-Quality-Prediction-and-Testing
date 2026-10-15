// FUNCIONALIDADE — escolha do modelo em uso.
import type { PredictionModel } from '../types';

/**
 * Devolve o modelo escolhido pela pessoa. Se ela ainda não escolheu (ou o modelo saiu do catálogo),
 * usa o primeiro da lista. A API não indica nenhum modelo como melhor que os outros.
 */
export function pickModel(models: PredictionModel[], chosenId: string | null): PredictionModel | null {
  return models.find((m) => m.id === chosenId) ?? models[0] ?? null;
}
