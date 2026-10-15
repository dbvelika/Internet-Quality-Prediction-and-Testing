import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, ChoiceCard, DateChips, ScreenLayout, TimePicker } from '../components';
import { ACTIVITIES } from '../constants/activities';
import { ICONS } from '../constants/icons';
import { nextHour } from '../logic/schedule';
import { common } from '../theme/commonStyles';
import type { Activity, EditableScreenProps } from '../types';

export function ActivityScreen({ state, patch, go }: EditableScreenProps) {
  const initial = state.activityWhen ?? state.schedule ?? nextHour();
  const [selected, setSelected] = useState<Activity | null>(state.activity);
  const [time, setTime] = useState(initial.time);
  const [date, setDate] = useState(initial.date);

  function check() {
    patch({ activity: selected, activityWhen: { date, time } });
    go('result');
  }

  return (
    <ScreenLayout title="O que você pretende fazer?" onBack={() => go('home')}>
      <Text style={common.muted}>Selecione uma atividade para verificar a qualidade prevista.</Text>

      <View style={common.stack}>
        {ACTIVITIES.map(({ code, label, icon }) => (
          <ChoiceCard key={code} title={label} icon={icon} selected={selected === code} onPress={() => setSelected(code)} />
        ))}
      </View>

      <View style={common.stack}>
        <Text style={common.fieldLabel}>{ICONS.calendar} Quando?</Text>
        <DateChips value={date} onChange={setDate} />
        <TimePicker value={time} onChange={setTime} custom />
      </View>

      <View style={common.stack}>
        <Button label="Verificar atividade" onPress={check} disabled={!selected} />
        <Button label="Voltar" onPress={() => go('home')} variant="secondary" />
      </View>
    </ScreenLayout>
  );
}
