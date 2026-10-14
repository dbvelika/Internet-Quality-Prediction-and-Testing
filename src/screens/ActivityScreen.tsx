import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, DateChips, IconBox, ScreenLayout, TimePicker } from '../components';
import { ACTIVITIES } from '../constants/activities';
import { ICONS } from '../constants/icons';
import { colors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius } from '../theme/tokens';
import type { Activity, EditableScreenProps } from '../types';

export function ActivityScreen({ state, patch, go }: EditableScreenProps) {
  const [selected, setSelected] = useState<Activity | null>(state.selectedActivity);
  const [time, setTime] = useState(state.activityTime || state.selectedTime);
  const [date, setDate] = useState(state.activityDate || state.selectedDate);

  function check() {
    patch({ selectedActivity: selected, activityTime: time, activityDate: date });
    go('result');
  }

  return (
    <ScreenLayout title="O que você pretende fazer?" onBack={() => go('home')}>
      <Text style={common.muted}>Selecione uma atividade para verificar a qualidade prevista.</Text>

      <View style={common.stack}>
        {ACTIVITIES.map(({ name, icon, desc }) => {
          const on = selected === name;
          return (
            <Pressable
              key={name}
              onPress={() => setSelected(name)}
              accessibilityRole="button"
              accessibilityLabel={`${name}. ${desc}`}
              accessibilityState={{ selected: on }}
              style={[styles.card, on && styles.cardOn]}
            >
              <IconBox icon={icon} background={on ? colors.blue100 : colors.white} />
              <View style={styles.cardText}>
                <Text style={[styles.cardName, on && { color: colors.blue900 }]}>{name}</Text>
                <Text style={[styles.cardDesc, on && { color: colors.blue }]}>{desc}</Text>
              </View>
              <View style={[styles.radio, on && styles.radioOn]}>
                {on ? <Text style={styles.radioCheck}>{ICONS.check}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={common.stack}>
        <Text style={common.fieldLabel}>{ICONS.calendar} Quando?</Text>
        <DateChips value={date} onChange={setDate} />
        <TimePicker value={time} onChange={setTime} />
      </View>

      <View style={common.stack}>
        <Button label="Verificar atividade" onPress={check} disabled={!selected} />
        <Button label="Voltar" onPress={() => go('home')} variant="secondary" />
      </View>
    </ScreenLayout>
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
  cardText: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: colors.slate800 },
  cardDesc: { fontSize: 12, color: colors.slate500 },
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
  radioCheck: { color: colors.white, fontSize: 12 },
});
