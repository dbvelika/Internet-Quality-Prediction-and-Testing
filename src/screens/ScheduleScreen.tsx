import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, DateChips, IconBox, ScreenLayout, TimePicker } from '../components';
import { ICONS } from '../constants/icons';
import { nextHour } from '../logic/schedule';
import { colors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { radius } from '../theme/tokens';
import type { EditableScreenProps } from '../types';

export function ScheduleScreen({ state, patch, go }: EditableScreenProps) {
  const initial = state.schedule ?? nextHour();
  const [time, setTime] = useState(initial.time);
  const [date, setDate] = useState(initial.date);

  function confirm() {
    patch({ schedule: { date, time } });
    go('home');
  }

  function resetToNext() {
    patch({ schedule: null });
    go('home');
  }

  return (
    <ScreenLayout title="Escolha o horário" onBack={() => go('home')}>
      <Text style={common.muted}>Qual horário você quer consultar?</Text>

      <View>
        <Text style={common.fieldLabel}>{ICONS.calendar} Data</Text>
        <DateChips value={date} onChange={setDate} />
      </View>

      <View>
        <Text style={common.fieldLabel}>{ICONS.clock} Horário</Text>
        <TimePicker value={time} onChange={setTime} custom />
      </View>

      <View style={styles.preview}>
        <IconBox icon={ICONS.clock} background={colors.blue} size={40} iconSize={16} />
        <View>
          <Text style={styles.previewLabel}>Horário selecionado</Text>
          <Text style={styles.previewTime}>{time}</Text>
        </View>
      </View>

      <Text style={common.hint}>
        Você verá a primeira previsão disponível a partir do horário escolhido. Os horários exibidos seguem o fuso do seu
        aparelho.
      </Text>

      <View style={common.stack}>
        <Button label="Consultar previsão" onPress={confirm} />
        <Button label="Ver a próxima previsão" onPress={resetToNext} variant="secondary" />
        <Button label="Voltar" onPress={() => go('home')} variant="ghost" />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.blue50,
    borderColor: colors.blue100,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: 16,
  },
  previewLabel: { fontSize: 12, fontWeight: '600', color: colors.blue },
  previewTime: { fontSize: 18, fontWeight: '700', color: colors.blue800 },
});
