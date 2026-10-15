import { StyleSheet, Text, View } from 'react-native';
import { Button, ErrorState, LoadingState, ScreenLayout } from '../components';
import { ABOUT, GLOSSARY } from '../content/texts';
import { useForecast } from '../hooks/queries';
import { colors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import type { ScreenProps } from '../types';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <Text style={common.body}>{children}</Text>
    </View>
  );
}

/** "Sobre esta previsão": avisos obrigatórios da API + o que latência e perda significam. */
export function AboutScreen({ state, go }: ScreenProps) {
  // Os avisos não dependem do horário; pedir a previsão sem horário reaproveita a resposta em cache.
  const { data: forecast, loading, error, reload } = useForecast(state.modelId, state.place, null);

  return (
    <ScreenLayout title="Sobre esta previsão" onBack={() => go('home')}>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {forecast ? (
        <>
          <Section title={ABOUT.represents}>{forecast.notes.disclaimer}</Section>
          <Section title={ABOUT.privacy}>{forecast.notes.locationPrivacy}</Section>
        </>
      ) : null}

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {ABOUT.meaning}
        </Text>
        <Text style={common.body}>{GLOSSARY.latency.hint}</Text>
        <Text style={common.body}>{GLOSSARY.loss.hint}</Text>
      </View>

      <Button label="Fechar" onPress={() => go('home')} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.slate900 },
});
