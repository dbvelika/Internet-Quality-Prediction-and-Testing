import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MOCK_NOTICE } from '../content/texts';
import { colors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius } from '../theme/tokens';
import { Button } from './Button';

export function LoadingState({ text = 'Buscando a previsão…' }: { text?: string }) {
  return (
    <View style={styles.loading} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.blue} />
      <Text style={common.muted}>{text}</Text>
    </View>
  );
}

/** Explica o que houve e oferece a ação de tentar de novo. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={[common.card, styles.error]}>
      <Text style={styles.errorTitle}>Não foi possível carregar a previsão</Text>
      <Text style={common.body}>{message}</Text>
      <Button label="Tentar de novo" onPress={onRetry} />
    </View>
  );
}

/** Avisa que os números são de exemplo, para ninguém confundir com medição real. */
export function MockNotice() {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{MOCK_NOTICE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 32 },
  error: { backgroundColor: colors.redBg, borderColor: '#fecaca', gap: 12 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#991b1b' },
  notice: { backgroundColor: colors.slate100, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8 },
  noticeText: { fontSize: 12, color: colors.slate600 },
});
