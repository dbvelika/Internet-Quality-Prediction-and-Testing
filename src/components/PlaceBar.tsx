import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ICONS } from '../constants/icons';
import { colors } from '../theme/colors';
import { common } from '../theme/commonStyles';
import { touch } from '../theme/tokens';
import type { LocationStatus, Place } from '../types';

interface Props {
  place: Place;
  status: LocationStatus;
  onUseDevice: () => void;
}

/** Mostra a região usada na consulta e deixa a pessoa trocá-la pela localização do aparelho (opcional). */
export function PlaceBar({ place, status, onUseDevice }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.place}>
          {ICONS.pin} {place.label}
        </Text>
        {place.source === 'reference' ? (
          <Pressable
            onPress={onUseDevice}
            disabled={status === 'loading'}
            accessibilityRole="button"
            accessibilityLabel="Usar minha localização aproximada"
            style={styles.link}
          >
            <Text style={styles.linkText}>{status === 'loading' ? 'Buscando…' : 'Usar minha localização'}</Text>
          </Pressable>
        ) : null}
      </View>
      {status === 'denied' ? (
        <Text style={common.hint}>Sem permissão de localização. Seguimos com a região de referência.</Text>
      ) : null}
      {status === 'error' ? <Text style={common.hint}>Não foi possível obter sua localização agora.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  place: { flexShrink: 1, fontSize: 14, fontWeight: '500', color: colors.slate700 },
  link: { minHeight: touch.minSize, justifyContent: 'center' },
  linkText: { fontSize: 14, fontWeight: '600', color: colors.blue },
});
