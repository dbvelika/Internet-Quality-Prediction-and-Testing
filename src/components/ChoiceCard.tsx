import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ICONS } from '../constants/icons';
import { colors } from '../theme/colors';
import { radius } from '../theme/tokens';
import { IconBox } from './IconBox';

interface Props {
  title: string;
  /** Linhas de apoio abaixo do título. */
  lines?: string[];
  icon?: string;
  selected: boolean;
  onPress: () => void;
}

/** Cartão de escolha única (atividade, modelo). */
export function ChoiceCard({ title, lines = [], icon, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, ...lines].join('. ')}
      accessibilityState={{ selected }}
      style={[styles.card, selected && styles.cardOn]}
    >
      {icon ? <IconBox icon={icon} background={selected ? colors.blue100 : colors.white} /> : null}
      <View style={styles.text}>
        <Text style={[styles.title, selected && { color: colors.blue900 }]}>{title}</Text>
        {lines.map((line, index) => (
          <Text key={`${index}-${line}`} style={[styles.line, selected && { color: colors.blue }]}>
            {line}
          </Text>
        ))}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected ? <Text style={styles.check}>{ICONS.check}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: radius.md,
    padding: 16,
    backgroundColor: colors.slate50,
    borderWidth: 2,
    borderColor: colors.slate100,
  },
  cardOn: { backgroundColor: colors.blue50, borderColor: colors.blue },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '600', color: colors.slate800 },
  line: { fontSize: 12, color: colors.slate500, lineHeight: 18 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  check: { color: colors.white, fontSize: 12 },
});
