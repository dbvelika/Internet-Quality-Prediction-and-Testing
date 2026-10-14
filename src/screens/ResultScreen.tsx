import { StyleSheet, Text, View } from 'react-native';
import { Button, ErrorState, IconBox, LoadingState, MockNotice, QualityBadge, ScreenLayout } from '../components';
import { ACTIVITIES } from '../constants/activities';
import { QUALITY_ICON } from '../constants/icons';
import { ACTIVITY_VERDICT, DEMANDING_ACTIVITY_NOTE, GLOSSARY, LEVEL_LABEL } from '../content/texts';
import { useForecast } from '../hooks/useForecast';
import { getActivityQuality, getIndicatorRows } from '../logic/rules';
import { colors, levelColors, qualityColors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius } from '../theme/tokens';
import type { Activity, Forecast, ScreenProps } from '../types';

function ResultContent({ forecast, activity }: { forecast: Forecast; activity: Activity }) {
  const quality = getActivityQuality(activity, forecast.quality);
  const c = qualityColors[quality];

  return (
    <>
      {forecast.source === 'mock' ? <MockNotice /> : null}

      <View style={[common.card, styles.result, { backgroundColor: c.bg, borderColor: c.border }]}>
        <IconBox
          icon={QUALITY_ICON[quality]}
          background={c.badgeBg}
          color={c.badgeFg}
          size={64}
          cornerRadius={radius.md}
          iconSize={30}
        />
        <QualityBadge quality={quality} />
        <Text style={[styles.verdict, { color: c.fg }]}>{ACTIVITY_VERDICT[quality]}</Text>
      </View>

      <View>
        <Text style={common.sectionLabel}>Por quê?</Text>
        <Text style={[common.body, styles.why]}>
          A previsão considera os indicadores técnicos da conexão esperados para este horário:
        </Text>
        <View style={styles.rows}>
          {getIndicatorRows(forecast).map(({ kind, level, measure }) => (
            <View key={kind} style={[common.box, styles.indicator]}>
              <Text style={common.body}>{GLOSSARY[kind].shortLabel}</Text>
              <Text style={[styles.indicatorValue, { color: levelColors[level].fg }]}>
                {LEVEL_LABEL[kind][level]} · {measure}
              </Text>
            </View>
          ))}
        </View>
        {quality !== forecast.quality ? <Text style={[common.hint, styles.note]}>{DEMANDING_ACTIVITY_NOTE}</Text> : null}
      </View>
    </>
  );
}

export function ResultScreen({ state, go }: ScreenProps) {
  const activity = state.selectedActivity ?? 'Videoconferência';
  const time = state.activityTime || state.selectedTime;
  const date = state.activityDate || state.selectedDate;
  const icon = ACTIVITIES.find((a) => a.name === activity)?.icon ?? '';
  const { forecast, loading, error, reload } = useForecast(date, time);

  return (
    <ScreenLayout title="Resultado da previsão" onBack={() => go('activity')}>
      <View style={[common.box, styles.activityBox]}>
        <IconBox icon={icon} background={colors.white} />
        <View style={styles.activityText}>
          <Text style={styles.activityLabel}>Atividade selecionada</Text>
          <Text style={styles.activityName}>{activity}</Text>
          <Text style={styles.activityWhen}>Horário: {time}</Text>
        </View>
      </View>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {forecast ? <ResultContent forecast={forecast} activity={activity} /> : null}

      <View style={common.stack}>
        <Button label="Consultar outro horário" onPress={() => go('schedule')} />
        <Button label="Escolher outra atividade" onPress={() => go('activity')} variant="secondary" />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  activityBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityText: { flexShrink: 1 },
  activityLabel: { fontSize: 12, color: colors.slate500, fontWeight: '500' },
  activityName: { fontSize: 16, fontWeight: '700', color: colors.slate800 },
  activityWhen: { fontSize: 12, color: colors.slate600 },
  result: { alignItems: 'center', gap: 12, padding: 24 },
  verdict: { fontSize: 14, fontWeight: '500', lineHeight: 21, textAlign: 'center' },
  why: { marginBottom: 12 },
  rows: { gap: 8 },
  indicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 12 },
  indicatorValue: { fontSize: 14, fontWeight: '600' },
  note: { marginTop: 12 },
});
