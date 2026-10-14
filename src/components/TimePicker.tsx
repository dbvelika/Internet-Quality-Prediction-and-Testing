import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { QUICK_TIMES } from '../constants/activities';
import { colors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius, touch } from '../theme/tokens';
import { isValidTime, maskTime } from '../utils/format';

interface Props {
  value: string;
  onChange: (time: string) => void;
  /** Mostra também o campo HH:MM para digitar outro horário. */
  custom?: boolean;
}

export function TimePicker({ value, onChange, custom = false }: Props) {
  const [text, setText] = useState(value);
  const invalid = text.length === 5 && !isValidTime(text);

  function edit(raw: string) {
    const masked = maskTime(raw);
    setText(masked);
    if (isValidTime(masked)) onChange(masked);
  }

  return (
    <View>
      <View style={[styles.chips, custom && styles.chipsSpaced]}>
        {QUICK_TIMES.map((t) => {
          const on = value === t;
          return (
            <Pressable
              key={t}
              onPress={() => {
                setText(t);
                onChange(t);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Horário ${t}`}
              accessibilityState={{ selected: on }}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
      {custom ? (
        <>
          <TextInput
            value={text}
            onChangeText={edit}
            keyboardType="number-pad"
            placeholder="HH:MM"
            placeholderTextColor={colors.slate400}
            maxLength={5}
            accessibilityLabel="Digitar um horário personalizado, no formato horas e minutos"
            style={[styles.input, invalid && styles.inputInvalid]}
          />
          <Text style={[common.hint, invalid && styles.hintInvalid]}>
            {invalid ? 'Horário inválido. Use o formato HH:MM, de 00:00 a 23:59.' : 'Ou digite um horário personalizado'}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8 },
  chipsSpaced: { marginBottom: 12 },
  chip: {
    flex: 1,
    minHeight: touch.minSize,
    borderRadius: 14,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.blue },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.slate600 },
  chipTextOn: { color: colors.white },
  input: {
    minHeight: touch.minSize,
    borderWidth: 2,
    borderColor: colors.slate200,
    backgroundColor: colors.slate50,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate700,
  },
  inputInvalid: { borderColor: colors.red },
  hintInvalid: { color: colors.red },
});
