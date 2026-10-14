import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { radius, touch } from '../theme/tokens';
import { formatDate, nextDays, toISO } from '../utils/format';

interface Props {
  value: string;
  onChange: (iso: string) => void;
}

/** Escolha de data entre os próximos 7 dias (sem gesto complexo, RNF06). */
export function DateChips({ value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
      {nextDays().map((d, i) => {
        const iso = toISO(d);
        const on = iso === value;
        const weekday = i === 0 ? 'hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        return (
          <Pressable
            key={iso}
            onPress={() => onChange(iso)}
            accessibilityRole="button"
            accessibilityLabel={formatDate(iso)}
            accessibilityState={{ selected: on }}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.small, on && styles.textOn]}>{weekday}</Text>
            <Text style={[styles.big, on && styles.textOn]}>{d.getDate()}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  chip: {
    width: 56,
    minHeight: touch.minSize,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.slate100,
    alignItems: 'center',
  },
  chipOn: { backgroundColor: colors.blue },
  textOn: { color: colors.white },
  small: { fontSize: 11, color: colors.slate500, fontWeight: '500' },
  big: { fontSize: 18, fontWeight: '700', color: colors.slate700 },
});
