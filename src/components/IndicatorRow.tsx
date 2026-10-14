import { StyleSheet, Text, View } from 'react-native';
import { GLOSSARY, LEVEL_LABEL } from '../content/texts';
import { colors, levelColors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius } from '../theme/tokens';
import type { IndicatorKind, Level } from '../types';

interface Props {
  kind: IndicatorKind;
  level: Level;
  /** Valor medido já formatado, ex.: "18 ms". */
  measure?: string;
}

/** Um indicador técnico com nível, valor e explicação em linguagem simples (RNF07). */
export function IndicatorRow({ kind, level, measure }: Props) {
  const { label, hint } = GLOSSARY[kind];
  const lv = levelColors[level];
  return (
    <View style={common.box}>
      <View style={styles.top}>
        <Text style={common.rowLabel}>{label}</Text>
        <Text style={[styles.chip, { color: lv.fg, backgroundColor: lv.bg }]}>{LEVEL_LABEL[kind][level]}</Text>
      </View>
      {measure ? <Text style={styles.measure}>{measure}</Text> : null}
      <Text style={common.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chip: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, overflow: 'hidden' },
  measure: { fontSize: 18, fontWeight: '700', color: colors.slate900, marginTop: 6 },
});
