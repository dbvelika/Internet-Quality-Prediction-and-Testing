// TELA — "Comparar modelos": o que cada modelo prevê para o mesmo horário da tela inicial.
//
// CRÉDITO: a ideia desta tela (a seção "O que cada modelo prevê") vem do aplicativo PreditorDeRedes
// (https://github.com/PedroNov4es/PreditorDeRedes), de Pedro Novaes, usada com autorização do autor.
// A implementação é nossa: usa a arquitetura do PredictNet (serviços → hooks → telas), o endpoint
// /forecasts/probes/{id}/compare e o resumo de concordância de src/logic/compare.ts.
import { StyleSheet, Text, View } from 'react-native';
import { comparisonLines, useLibrasText } from '../accessibility';
import { Button, ErrorState, IndicatorRow, LoadingState, QualityBadge, ScreenLayout } from '../components';
import { COMPARE_TEXT } from '../content/texts';
import { useComparison, useModels } from '../hooks/queries';
import { pickModel } from '../logic/models';
import { summarizeComparison } from '../logic/compare';
import { colors, qualityColors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import type { EditableScreenProps, ModelPrediction } from '../types';
import { formatDateTime, formatMs, formatPercent } from '../utils/format';

function rangeText(min: number, max: number, format: (n: number) => string): string {
  return format(min) === format(max) ? format(min) : `${format(min)} a ${format(max)}`;
}

function ModelCard({ model, inUse }: { model: ModelPrediction; inUse: boolean }) {
  const c = qualityColors[model.quality];
  return (
    <View style={[common.card, { backgroundColor: c.bg, borderColor: inUse ? c.fg : c.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={styles.modelName}>{model.modelName}</Text>
          {inUse ? <Text style={[styles.inUse, { color: c.fg }]}>{COMPARE_TEXT.inUse}</Text> : null}
        </View>
        <QualityBadge quality={model.quality} big={false} />
      </View>
      <View style={styles.rows}>
        <IndicatorRow kind="latency" measure={formatMs(model.latencyMs)} />
        <IndicatorRow kind="loss" measure={formatPercent(model.lossPct)} />
      </View>
    </View>
  );
}

export function CompareScreen({ state, go }: EditableScreenProps) {
  const { data: comparison, loading, error, reload } = useComparison(state.modelId, state.place, state.schedule);
  const { data: models } = useModels();
  const currentId = models ? (pickModel(models, state.modelId)?.id ?? null) : null;
  useLibrasText(comparison ? comparisonLines(comparison, currentId) : error ? [error] : [COMPARE_TEXT.intro]);

  const summary = comparison ? summarizeComparison(comparison.models) : null;

  return (
    <ScreenLayout title={COMPARE_TEXT.title} onBack={() => go('home')}>
      <Text style={common.muted}>{COMPARE_TEXT.intro}</Text>

      {loading ? <LoadingState text={COMPARE_TEXT.loading} /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {comparison && summary ? (
        <>
          <View style={common.box}>
            <Text style={common.rowLabel}>
              {COMPARE_TEXT.forTime} {formatDateTime(comparison.predictionFor)}
            </Text>
            <Text style={[common.body, styles.headline]}>{summary.headline}</Text>
            {summary.latency && summary.loss && comparison.models.length > 1 ? (
              <Text style={common.hint}>
                Latência entre {rangeText(summary.latency.min, summary.latency.max, formatMs)} · perda entre{' '}
                {rangeText(summary.loss.min, summary.loss.max, formatPercent)}
              </Text>
            ) : null}
          </View>

          <View style={common.stack}>
            {comparison.models.map((model) => (
              <ModelCard key={model.modelId} model={model} inUse={model.modelId === currentId} />
            ))}
          </View>
        </>
      ) : null}

      <View style={common.stack}>
        <Button label={COMPARE_TEXT.change} onPress={() => go('models')} />
        <Button label={COMPARE_TEXT.back} onPress={() => go('home')} variant="secondary" />
      </View>

      <Text style={styles.credit}>{COMPARE_TEXT.credit}</Text>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  cardTitle: { flexShrink: 1, gap: 2 },
  modelName: { fontSize: 18, fontWeight: '700', color: colors.slate900 },
  inUse: { fontSize: 12, fontWeight: '600' },
  rows: { gap: 8 },
  headline: { marginTop: 4 },
  credit: { fontSize: 12, color: colors.slate500, lineHeight: 18 },
});
