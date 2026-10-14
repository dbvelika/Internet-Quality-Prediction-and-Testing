import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ICONS } from '../constants/icons';
import { colors } from '../theme/colors';
import { touch } from '../theme/tokens';

interface Props {
  title?: string;
  onBack?: () => void;
  children: ReactNode;
}

/** Moldura de todas as telas: área segura, cabeçalho opcional com botão voltar e rolagem. */
export function ScreenLayout({ title, onBack, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {title ? (
          <View style={styles.header}>
            {onBack ? (
              <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Voltar" style={styles.back}>
                <Text style={styles.backIcon}>{ICONS.back}</Text>
              </Pressable>
            ) : null}
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
          </View>
        ) : null}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
  back: {
    width: touch.minSize,
    height: touch.minSize,
    borderRadius: touch.minSize / 2,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: colors.slate600, marginTop: -2 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.slate900 },
  content: { padding: 24, gap: 20 },
});
