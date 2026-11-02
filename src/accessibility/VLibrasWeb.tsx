// ACESSIBILIDADE — VLibras no navegador (Expo Web): o widget oficial fica na própria página.
import { useEffect } from 'react';
import { mountWebWidget } from './libras';

/** Não desenha nada no app: o widget cria o próprio botão (canto da página) e traduz o texto clicado ou selecionado. */
export function VLibrasWeb() {
  useEffect(() => {
    mountWebWidget(document, window);
  }, []);

  return null;
}
