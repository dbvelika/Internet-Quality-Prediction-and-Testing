// FUNCIONALIDADE — pede a localização do aparelho só quando a pessoa toca em "Usar minha localização".
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import type { LocationStatus, Place } from '../types';

/** Arredonda para 2 casas (cerca de 1 km): a API só precisa de uma referência geográfica aproximada. */
const round = (n: number) => Math.round(n * 100) / 100;

export function useDeviceLocation(onPlace: (place: Place) => void) {
  const [status, setStatus] = useState<LocationStatus>('idle');

  const request = useCallback(async () => {
    setStatus('loading');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setStatus('denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      onPlace({
        latitude: round(position.coords.latitude),
        longitude: round(position.coords.longitude),
        label: 'Sua localização aproximada',
        source: 'device',
      });
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }, [onPlace]);

  return { status, request };
}
