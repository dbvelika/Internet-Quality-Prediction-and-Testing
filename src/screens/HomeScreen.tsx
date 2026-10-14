import { StyleSheet, Text, View } from 'react-native';
import { Button, ErrorState, IconBox, LoadingState, MockNotice, QualityBadge, ScreenLayout } from '../components';
import { ACTIVITIES } from '../constants/activities';
import { ICONS, QUALITY_ICON } from '../constants/icons';
import { QUALITY_SUMMARY } from '../content/texts';
import { useForecast } from '../hooks/useForecast';
import { getAvailableActivities } from '../logic/rules';
import { colors, qualityColors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius } from '../theme/tokens';
import type { Forecast, ScreenProps } from '../types';
import { formatDate } from '../utils/format';

function ForecastSection({ forecast, time }: { forecast: Forecast; time: string }) {
  const { quality } = forecast;
  const c = qualityColors[quality];
  const available = getAvailableActivities(quality);

  return (
    <>
      {forecast.source === 'mock' ? <MockNotice /> : null}

      <View style={[common.card, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Text style={common.sectionLabel}>Qualidade esperada</Text>
        <View style={styles.qualityRow}>
          <IconBox
            icon={QUALITY_ICON[quality]}
            background={c.badgeBg}
            color={c.badgeFg}
            size={56}
            cornerRadius={radius.md}
          />
          <View style={styles.qualityText}>
            <QualityBadge quality={quality} />
            <Text style={[styles.forTime, { color: c.fg }]}>Para o horário das {time}</Text>
          </View>
        </View>
        <Text style={common.body}>{QUALITY_SUMMARY[quality]}</Text>
      </View>

      <View>
        <Text style={common.sectionLabel}>O que você poderá fazer?</Text>
        <View style={styles.activities}>
          {ACTIVITIES.map(({ name }) => {
            const ok = available.includes(name);
            return (
              <View key={name} style={[styles.activityRow, { backgroundColor: ok ? colors.greenBg : colors.slate50 }]}>
                <View style={[styles.dot, { backgroundColor: ok ? colors.green : colors.slate300 }]}>
                  <Text style={[styles.dotText, { color: ok ? colors.white : colors.slate500 }]}>
                    {ok ? ICONS.check : ICONS.dash}
                  </Text>
                </View>
                <Text style={[styles.activityName, { color: ok ? colors.slate800 : colors.slate500 }]}>{name}</Text>
                {!ok ? <Text style={styles.notRecommended}>Não recomendado</Text> : null}
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
}

export function HomeScreen({ state, go }: ScreenProps) {
  const { forecast, loading, error, reload } = useForecast(state.selectedDate, state.selectedTime);

  return (
    <ScreenLayout>
      <View style={common.row}>
        <IconBox icon={ICONS.logo} background={colors.blue} size={36} iconSize={18} />
        <Text style={styles.brand}>
          Compyuter<Text style={{ color: colors.blue }}>'s</Text>
        </Text>
      </View>
      <Text style={styles.tagline}>Previsão da sua conexão de internet</Text>

      <View style={common.row}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {ICONS.calendar} {formatDate(state.selectedDate)}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: colors.blue }]}>
          <Text style={[styles.pillText, { color: colors.white, fontWeight: '700' }]}>
            {ICONS.clock} {state.selectedTime}
          </Text>
        </View>
      </View>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {forecast ? <ForecastSection forecast={forecast} time={state.selectedTime} /> : null}

      <View style={common.stack}>
        <Button label="Ver detalhes" onPress={() => go('details')} disabled={!forecast} />
        <Button label="Escolher outro horário" onPress={() => go('schedule')} variant="secondary" />
        <Button label="Ver por atividade →" onPress={() => go('activity')} variant="ghost" />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  brand: { fontSize: 24, fontWeight: '800', color: colors.slate900 },
  tagline: { fontSize: 14, color: colors.slate500, fontWeight: '500', marginTop: -12 },
  pill: { backgroundColor: colors.slate100, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8 },
  pillText: { fontSize: 14, fontWeight: '500', color: colors.slate700 },
  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  qualityText: { flex: 1, alignItems: 'flex-start', gap: 4 },
  forTime: { fontSize: 12, fontWeight: '500' },
  activities: { gap: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 12, fontWeight: '700' },
  activityName: { flex: 1, fontSize: 14, fontWeight: '500' },
  notRecommended: { fontSize: 12, color: colors.slate500 },
});
