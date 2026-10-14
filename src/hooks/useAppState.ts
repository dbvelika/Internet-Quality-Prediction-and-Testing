// FUNCIONALIDADE — estado global do app e navegação entre telas.
import { useCallback, useState } from 'react';
import type { AppState, ScreenName } from '../types';
import { toISO } from '../utils/format';

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    const today = toISO(new Date());
    return {
      screen: 'home',
      selectedTime: '20:00',
      selectedDate: today,
      selectedActivity: null,
      activityTime: '20:00',
      activityDate: today,
    };
  });

  const go = useCallback((screen: ScreenName) => setState((prev) => ({ ...prev, screen })), []);
  const patch = useCallback((changes: Partial<AppState>) => setState((prev) => ({ ...prev, ...changes })), []);

  return { state, go, patch };
}
