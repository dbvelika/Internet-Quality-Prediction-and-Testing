// DESIGN — estilos que se repetem em várias telas e componentes.
import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { radius } from './tokens';

export const common = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  muted: { fontSize: 14, color: colors.slate500 },
  body: { fontSize: 14, color: colors.slate600, lineHeight: 21 },
  hint: { fontSize: 12, color: colors.slate500, lineHeight: 18, marginTop: 6 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.slate700, marginBottom: 8 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: colors.slate800 },
  card: { borderRadius: radius.lg, borderWidth: 2, padding: 20 },
  box: { backgroundColor: colors.slate50, borderRadius: radius.md, padding: 16 },
});
