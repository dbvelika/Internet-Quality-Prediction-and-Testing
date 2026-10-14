import { StyleSheet, Text, View } from 'react-native';
import { Button, ErrorState, IconBox, IndicatorRow, LoadingState, MockNotice, QualityBadge, ScreenLayout } from '../components';
import { ICONS, QUALITY_ICON } from '../constants/icons';
import { QUALITY_MEANING } from '../content/texts';
import { useForecast } from '../hooks/useForecast';
import { getIndicatorRows } from '../logic/rules';
import { colors, qualityColors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius } from '../theme/tokens';
import type { Forecast, ScreenProps } from '../types';

function DetailsContent({ forecast, time }: { forecast: Forecast; time: string }) {
  const { quality } = forecast;
  const c = qualityColors[quality];

  return (
    <>
      {forecast.source === 'mock' ? <MockNotice /> : null}

      <View style={[common.card, styles.summary, { backgroundColor: c.bg, borderColor: c.border }]}>
        <IconBox icon={QUALITY_ICON[quality]} background={c.badgeBg} color={c.badgeFg} size={56} cornerRadius={radius.md} />
        <View style={styles.summaryText}>
          <Text style={styles.summaryLabel}>Previsão para {time}</Text>
          <QualityBadge quality={quality} />
        </View>
      </View>

      <View>
        <Text style={common.sectionLabel}>Indicadores da conexão</Text>
        <View style={styles.indicators}>
          {getIndicatorRows(forecast).map((row) => (
            <IndicatorRow key={row.kind} kind={row.kind} level={row.level} measure={row.measure} />
          ))}
        </View>
      </View>

      <View style={common.box}>
        <Text style={[common.rowLabel, styles.meaningTitle]}>{ICONS.tip} O que isso significa?</Text>
        <Text style={common.body}>{QUALITY_MEANING[quality]}</Text>
      </View>
    </>
  );
}

export function DetailsScreen({ state, go }: ScreenProps) {
  const { forecast, loading, error, reload } = useForecast(state.selectedDate, state.selectedTime);

  return (
    <ScreenLayout title="Detalhes da previsão" onBack={() => go('home')}>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {forecast ? <DetailsContent forecast={forecast} time={state.selectedTime} /> : null}

      <View style={common.stack}>
        <Button label="Ver atividades" onPress={() => go('activity')} />
        <Button label="Fechar" onPress={() => go('home')} variant="secondary" />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryText: { alignItems: 'flex-start', gap: 4, flexShrink: 1 },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: colors.slate500 },
  indicators: { gap: 8 },
  meaningTitle: { marginBottom: 8 },
});
