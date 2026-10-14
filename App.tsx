// Ponto de entrada: só decide qual tela mostrar. Design, regras, dados e textos ficam em src/.
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppState } from './src/hooks/useAppState';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';

export default function App() {
  const { state, go, patch } = useAppState();

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {state.screen === 'home' && <HomeScreen state={state} go={go} />}
      {state.screen === 'schedule' && <ScheduleScreen state={state} patch={patch} go={go} />}
      {state.screen === 'details' && <DetailsScreen state={state} go={go} />}
      {state.screen === 'activity' && <ActivityScreen state={state} patch={patch} go={go} />}
      {state.screen === 'result' && <ResultScreen state={state} go={go} />}
    </SafeAreaProvider>
  );
}
