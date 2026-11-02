// ACESSIBILIDADE — VLibras no celular: botão flutuante que abre uma janela com o widget dentro de uma WebView.
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ICONS } from '../constants/icons';
import { LIBRAS_TEXT } from '../content/texts';
import { colors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius, touch } from '../theme/tokens';
import { useLibrasLines } from './LibrasContext';
import { VLIBRAS_ORIGIN, buildLibrasHtml, isAllowedLibrasUrl } from './libras';

function LibrasModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const lines = useLibrasLines();
  // A página só é montada com a janela aberta (o Modal não desenha nada quando fechado).
  const html = useMemo(() => buildLibrasHtml(lines), [lines]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text accessibilityRole="header" style={styles.title}>
              {LIBRAS_TEXT.title}
            </Text>
            <Text style={common.muted}>{LIBRAS_TEXT.subtitle}</Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={LIBRAS_TEXT.closeLabel}
            style={styles.close}
          >
            <Text style={styles.closeText}>{LIBRAS_TEXT.close}</Text>
          </Pressable>
        </View>

        <WebView
          source={{ html, baseUrl: `${VLIBRAS_ORIGIN}/` }}
          originWhitelist={['https://*']}
          onShouldStartLoadWithRequest={(request) => isAllowedLibrasUrl(request.url)}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          allowsInlineMediaPlayback
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.blue} />
              <Text style={common.muted}>{LIBRAS_TEXT.loading}</Text>
            </View>
          )}
          style={styles.web}
        />

        <Text style={[common.hint, styles.credit]}>{LIBRAS_TEXT.credit}</Text>
      </SafeAreaView>
    </Modal>
  );
}

/** Botão fixo no canto da tela (mínimo de 48 dp, ícone + texto) e a janela do VLibras. */
export function VLibrasButton() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={LIBRAS_TEXT.buttonLabel}
        accessibilityHint={LIBRAS_TEXT.buttonHint}
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 16 }, pressed && styles.pressed]}
      >
        <Text style={styles.fabIcon}>{ICONS.libras}</Text>
        <Text style={styles.fabLabel}>{LIBRAS_TEXT.button}</Text>
      </Pressable>
      <LibrasModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    minHeight: touch.minSize + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  pressed: { transform: [{ scale: 0.97 }] },
  fabIcon: { fontSize: 20, color: colors.white },
  fabLabel: { fontSize: 16, fontWeight: '700', color: colors.white },
  modal: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: colors.slate900 },
  close: {
    minHeight: touch.minSize,
    minWidth: touch.minSize,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 16, fontWeight: '600', color: colors.slate700 },
  web: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.white,
  },
  credit: { paddingHorizontal: 24, paddingBottom: 12, marginTop: 8 },
});
