import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, ErrorState, LoadingState, QualityBadge, ScreenLayout } from '../components';
import { useTimeline } from '../hooks/queries';
import { scheduleFromIso } from '../logic/schedule';
import { colors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius, touch } from '../theme/tokens';
import type { EditableScreenProps, TimelineEntry } from '../types';
import { formatDateTime, formatMs, formatPercent } from '../utils/format';

export function TimelineScreen({ state, patch, go }: EditableScreenProps) {
  const { data: entries, loading, error, reload } = useTimeline(state.modelId, state.place);

  function choose(entry: TimelineEntry) {
    patch({ schedule: scheduleFromIso(entry.predictionFor) });
    go('home');
  }

  return (
    <ScreenLayout title="Próximas previsões" onBack={() => go('home')}>
      <Text style={common.muted}>Toque em um horário para ver a previsão completa.</Text>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {entries && entries.length === 0 ? (
        <Text style={common.body}>Ainda não há previsões para esta região e este modelo.</Text>
      ) : null}

      <View style={styles.list}>
        {entries?.map((entry) => (
          <Pressable
            key={entry.predictionFor}
            onPress={() => choose(entry)}
            accessibilityRole="button"
            accessibilityLabel={`${formatDateTime(entry.predictionFor)}. Qualidade ${entry.quality}. Toque para ver a previsão completa.`}
            style={styles.row}
          >
            <View style={styles.rowText}>
              <Text style={styles.when}>{formatDateTime(entry.predictionFor)}</Text>
              <Text style={styles.values}>
                {formatMs(entry.latencyMs)} · perda {formatPercent(entry.lossPct)}
              </Text>
            </View>
            <QualityBadge quality={entry.quality} big={false} />
          </Pressable>
        ))}
      </View>

      <Button label="Voltar" onPress={() => go('home')} variant="secondary" />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: {
    minHeight: touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.slate50,
    borderRadius: radius.md,
    padding: 16,
  },
  rowText: { flexShrink: 1, gap: 2 },
  when: { fontSize: 14, fontWeight: '600', color: colors.slate800 },
  values: { fontSize: 12, color: colors.slate500 },
});
