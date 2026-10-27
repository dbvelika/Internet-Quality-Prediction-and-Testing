import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, ErrorState, IconBox, IndicatorRow, LoadingState, PlaceBar, QualityBadge, ScreenLayout } from '../components';
import { ICONS, QUALITY_ICON } from '../constants/icons';
import { QUALITY_SUMMARY } from '../content/texts';
import { useDeviceLocation } from '../hooks/useDeviceLocation';
import { useForecast } from '../hooks/queries';
import { colors, qualityColors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius, touch } from '../theme/tokens';
import type { EditableScreenProps, Forecast } from '../types';
import { formatDateTime, formatKm, formatMs, formatPercent } from '../utils/format';

function ForecastSection({ forecast, scheduled }: { forecast: Forecast; scheduled: boolean }) {
  const c = qualityColors[forecast.quality];

  return (
    <>
      <View style={[common.card, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Text style={common.sectionLabel}>Qualidade esperada</Text>
        <View style={styles.qualityRow}>
          <IconBox
            icon={QUALITY_ICON[forecast.quality]}
            background={c.badgeBg}
            color={c.badgeFg}
            size={56}
            cornerRadius={radius.md}
          />
          <View style={styles.qualityText}>
            <QualityBadge quality={forecast.quality} />
            <Text style={[styles.forTime, { color: c.fg }]}>
              {scheduled ? 'Previsão para' : 'Próxima previsão:'} {formatDateTime(forecast.predictionFor)}
            </Text>
          </View>
        </View>
        <Text style={common.body}>{forecast.advice ?? QUALITY_SUMMARY[forecast.quality]}</Text>
      </View>

      <View>
        <Text style={common.sectionLabel}>Detalhes da previsão</Text>
        <View style={styles.rows}>
          <IndicatorRow kind="latency" measure={formatMs(forecast.latencyMs)} />
          <IndicatorRow kind="loss" measure={formatPercent(forecast.lossPct)} />
        </View>
      </View>

      <View style={common.box}>
        <Text style={common.rowLabel}>Referência de medição</Text>
        <Text style={common.body}>Probe a aproximadamente {formatKm(forecast.probe.distanceKm)}</Text>
      </View>
    </>
  );
}

export function HomeScreen({ state, patch, go }: EditableScreenProps) {
  const { data: forecast, loading, error, reload } = useForecast(state.modelId, state.place, state.schedule);
  const location = useDeviceLocation((place) => patch({ place }));

  return (
    <ScreenLayout>
      <View style={common.row}>
        <IconBox icon={ICONS.logo} background={colors.blue} size={36} iconSize={18} />
        <Text style={styles.brand}>
          Compyuter<Text style={{ color: colors.blue }}>'s</Text>
        </Text>
      </View>

      <View style={styles.modelRow}>
        <View style={styles.modelText}>
          <Text style={styles.modelLabel}>Modelo em uso</Text>
          <Text style={styles.modelName}>{forecast?.model.name ?? (loading ? 'Carregando…' : '—')}</Text>
        </View>
        <Pressable
          onPress={() => go('models')}
          accessibilityRole="button"
          accessibilityLabel="Alterar modelo de previsão"
          style={styles.change}
        >
          <Text style={styles.changeText}>Alterar</Text>
        </Pressable>
      </View>

      <PlaceBar place={state.place} status={location.status} onUseDevice={location.request} />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {error && state.schedule ? (
        <Button label="Ver a próxima previsão" onPress={() => patch({ schedule: null })} variant="secondary" />
      ) : null}
      {forecast ? <ForecastSection forecast={forecast} scheduled={state.schedule !== null} /> : null}

      <View style={common.stack}>
        <Button label="Planejar uma atividade" onPress={() => go('activity')} />
        <Button label="Escolher outro horário" onPress={() => go('schedule')} variant="secondary" />
        <Button label="Entenda esta previsão" onPress={() => go('about')} variant="secondary" />
        <Button label="Ver próximas previsões" onPress={() => go('timeline')} variant="ghost" />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  brand: { fontSize: 24, fontWeight: '800', color: colors.slate900 },
  modelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  modelText: { flexShrink: 1 },
  modelLabel: { fontSize: 12, color: colors.slate500, fontWeight: '500' },
  modelName: { fontSize: 20, fontWeight: '700', color: colors.slate900 },
  change: { minHeight: touch.minSize, justifyContent: 'center', paddingHorizontal: 8 },
  changeText: { fontSize: 14, fontWeight: '600', color: colors.blue },
  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  qualityText: { flex: 1, alignItems: 'flex-start', gap: 4 },
  forTime: { fontSize: 12, fontWeight: '500' },
  rows: { gap: 8 },
});
