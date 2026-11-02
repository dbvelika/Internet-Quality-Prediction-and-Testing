// ACESSIBILIDADE — ponto de entrada: escolhe a forma de mostrar o VLibras conforme onde o app roda.
import { Platform } from 'react-native';
import { VLibrasWeb } from './VLibrasWeb';

declare const require: (id: string) => unknown;

export function VLibras() {
  if (Platform.OS === 'web') return <VLibrasWeb />;

  // O botão do celular usa a WebView, que não existe na web. Por isso o módulo só é carregado aqui,
  // no celular, e a versão web do app nunca chega a executá-lo.
  const { VLibrasButton } = require('./VLibrasPanel') as typeof import('./VLibrasPanel');
  return <VLibrasButton />;
}
