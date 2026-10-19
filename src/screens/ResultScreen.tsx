import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, ErrorState, IconBox, IndicatorRow, LoadingState, QualityBadge, ScreenLayout } from '../components';
import { ACTIVITIES } from '../constants/activities';
import { QUALITY_ICON } from '../constants/icons';
import { SUITABILITY } from '../content/texts';
import { useActivityCheck } from '../hooks/queries';
import { nextHour } from '../logic/schedule';
import { colors, qualityColors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius } from '../theme/tokens';
import type { ActivityResult, Schedule, ScreenProps } from '../types';
import { formatDate, formatMs, formatPercent } from '../utils/format';

function ResultContent({ result }: { result: ActivityResult }) {
  const c = qualityColors[result.quality];

  return (
    <>
      <View style={[common.card, styles.result, { backgroundColor: c.bg, borderColor: c.border }]}>
        <IconBox
          icon={QUALITY_ICON[result.quality]}
          background={c.badgeBg}
          color={c.badgeFg}
          size={64}
          cornerRadius={radius.md}
          iconSize={30}
        />
        <QualityBadge quality={result.quality} />
        <Text accessibilityRole="header" style={[styles.verdict, { color: c.fg }]}>
          {result.suitable ? SUITABILITY.suitable : SUITABILITY.unsuitable}
        </Text>
        <Text style={[common.body, styles.advice]}>{result.advice}</Text>
      </View>

      <View>
        <Text style={common.sectionLabel}>Detalhes da previsão</Text>
        <View style={styles.rows}>
          <IndicatorRow kind="latency" measure={formatMs(result.latencyMs)} />
          <IndicatorRow kind="loss" measure={formatPercent(result.lossPct)} />
        </View>
      </View>

      <Text style={common.hint}>{result.notes.disclaimer}</Text>
    </>
  );
}

export function ResultScreen({ state, go }: ScreenProps) {
  const activity = state.activity ?? 'VIDEO_CALL';
  const [when] = useState<Schedule>(() => state.activityWhen ?? nextHour());
  const { data: result, loading, error, reload } = useActivityCheck(state.modelId, state.place, activity, when);
  const info = ACTIVITIES.find((a) => a.code === activity);

  return (
    <ScreenLayout title="Resultado da previsão" onBack={() => go('activity')}>
      <View style={[common.box, styles.activityBox]}>
        <IconBox icon={info?.icon ?? ''} background={colors.white} />
        <View style={styles.activityText}>
          <Text style={styles.activityLabel}>Atividade selecionada</Text>
          <Text style={styles.activityName}>{info?.label}</Text>
          <Text style={styles.activityWhen}>
            {formatDate(when.date)} · {when.time}
          </Text>
        </View>
      </View>

      {loading ? <LoadingState text="Verificando a atividade…" /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {result ? <ResultContent result={result} /> : null}

      <View style={common.stack}>
        <Button label="Escolher outra atividade ou horário" onPress={() => go('activity')} />
        <Button label="Voltar ao início" onPress={() => go('home')} variant="ghost" />
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
  verdict: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  advice: { textAlign: 'center' },
  rows: { gap: 8 },
});
