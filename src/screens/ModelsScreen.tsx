import { StyleSheet, Text, View } from 'react-native';
import { Button, ChoiceCard, ErrorState, LoadingState, ScreenLayout } from '../components';
import { useModels } from '../hooks/queries';
import { pickModel } from '../logic/models';
import { common } from '../theme/commonStyles';
import type { EditableScreenProps } from '../types';

export function ModelsScreen({ state, patch, go }: EditableScreenProps) {
  const { data: models, loading, error, reload } = useModels();
  const currentId = models ? pickModel(models, state.modelId)?.id : null;

  return (
    <ScreenLayout title="Escolha o modelo" onBack={() => go('home')}>
      <Text style={common.muted}>
        Cada modelo foi desenvolvido por um grupo e pode gerar previsões diferentes para o mesmo horário.
      </Text>

      {loading ? <LoadingState text="Buscando os modelos…" /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      <View style={styles.list}>
        {models?.map((model) => (
          <ChoiceCard
            key={model.id}
            title={model.name}
            lines={[model.groupName, `${model.algorithm} · versão ${model.version}`, model.description].filter(Boolean)}
            selected={model.id === currentId}
            onPress={() => {
              patch({ modelId: model.id });
              go('home');
            }}
          />
        ))}
      </View>

      <Button label="Voltar" onPress={() => go('home')} variant="secondary" />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
});
