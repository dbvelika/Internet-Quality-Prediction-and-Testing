import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { Button } from './Button';

const SLOW_AFTER_MS = 6000;

export function LoadingState({ text = 'Buscando a previsão…' }: { text?: string }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.loading} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.blue} />
      <View style={styles.loadingText}>
        <Text style={common.muted}>{text}</Text>
        {slow ? <Text style={common.hint}>O servidor pode levar até 1 minuto para acordar na primeira consulta.</Text> : null}
      </View>
    </View>
  );
}

/** Explica o que houve e oferece a ação de tentar de novo. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={[common.card, styles.error]}>
      <Text style={styles.errorTitle}>Não foi possível carregar</Text>
      <Text style={common.body}>{message}</Text>
      <Button label="Tentar de novo" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 32 },
  loadingText: { flexShrink: 1 },
  error: { backgroundColor: colors.redBg, borderColor: '#fecaca', gap: 12 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#991b1b' },
});
