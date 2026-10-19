import { StyleSheet, Text, View } from 'react-native';
import { GLOSSARY } from '../content/texts';
import { colors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import type { IndicatorKind } from '../types';

interface Props {
  kind: IndicatorKind;
  /** Valor já formatado, ex.: "49,1 ms". */
  measure: string;
}

/** Um indicador previsto (latência ou perda). A explicação em linguagem simples fica em "Entenda esta previsão". */
export function IndicatorRow({ kind, measure }: Props) {
  const { label } = GLOSSARY[kind];
  return (
    <View accessible accessibilityLabel={`${label}: ${measure}`} style={[common.box, styles.row]}>
      <Text style={common.rowLabel}>{label}</Text>
      <Text style={styles.measure}>{measure}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  measure: { fontSize: 16, fontWeight: '700', color: colors.slate900 },
});
