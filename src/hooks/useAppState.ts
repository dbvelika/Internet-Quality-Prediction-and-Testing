// FUNCIONALIDADE — estado global do app e navegação entre telas.
import { useCallback, useState } from 'react';
import { DEFAULT_PLACE } from '../services/config';
import type { AppState, ScreenName } from '../types';

export function useAppState() {
  const [state, setState] = useState<AppState>({
    screen: 'home',
    modelId: null,
    place: DEFAULT_PLACE,
    schedule: null,
    activity: null,
    activityWhen: null,
  });

  const go = useCallback((screen: ScreenName) => setState((prev) => ({ ...prev, screen })), []);
  const patch = useCallback((changes: Partial<AppState>) => setState((prev) => ({ ...prev, ...changes })), []);

  return { state, go, patch };
}
