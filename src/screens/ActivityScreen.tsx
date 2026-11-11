import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLibrasText } from '../accessibility';
import { Button, ChoiceCard, DateChips, ScreenLayout, TimePicker } from '../components';
import { ACTIVITIES } from '../constants/activities';
import { ICONS } from '../constants/icons';
import { LIBRAS_TEXT } from '../content/texts';
import { nextHour } from '../logic/schedule';
import { common } from '../theme/commonStyles';
import type { Activity, EditableScreenProps } from '../types';
import { formatDate } from '../utils/format';

export function ActivityScreen({ state, patch, go }: EditableScreenProps) {
  const initial = state.activityWhen ?? state.schedule ?? nextHour();
  const [selected, setSelected] = useState<Activity | null>(state.activity);
  const [time, setTime] = useState(initial.time);
  const [date, setDate] = useState(initial.date);
  useLibrasText(LIBRAS_TEXT.screens.activity);

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
        {/* Os atalhos de data cobrem só os próximos 7 dias; esta linha mostra sempre a data escolhida. */}
        <Text style={common.hint}>
          Selecionado: {formatDate(date)} · {time}
        </Text>
      </View>

      <View style={common.stack}>
        <Button label="Verificar atividade" onPress={check} disabled={!selected} />
        <Button label="Voltar" onPress={() => go('home')} variant="secondary" />
      </View>
    </ScreenLayout>
  );
}
