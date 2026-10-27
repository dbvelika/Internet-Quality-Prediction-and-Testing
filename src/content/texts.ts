// TEXTOS — mensagens e glossário. Termos técnicos explicados em linguagem simples (RNF07).
import type { ApiErrorKind, IndicatorKind, Quality } from '../types';

/** Frase usada quando a API não envia uma recomendação (previsão vinda da linha do tempo). */
export const QUALITY_SUMMARY: Record<Quality, string> = {
  BOA: 'Sua conexão deve funcionar bem neste horário.',
  REGULAR: 'A conexão pode apresentar alguma instabilidade neste período.',
  'INSTÁVEL': 'A conexão pode ser instável neste período.',
};

export const GLOSSARY: Record<IndicatorKind, { label: string; hint: string }> = {
  latency: {
    label: 'Latência prevista',
    hint: 'Latência representa o tempo necessário para os dados percorrerem a rede. Valores mais altos podem deixar chamadas e páginas mais lentas.',
  },
  loss: {
    label: 'Perda prevista',
    hint: 'Perda representa a proporção estimada de pacotes que podem não chegar ao destino. Valores mais altos podem causar cortes ou falhas.',
  },
};

export const SUITABILITY = {
  suitable: 'Deve funcionar bem',
  unsuitable: 'Pode apresentar dificuldades',
};

export const ABOUT = {
  represents: 'O que esta previsão representa',
  privacy: 'Privacidade da localização',
  meaning: 'O que isso significa?',
};

export const ERROR_TEXT: Record<ApiErrorKind | 'unknown', string> = {
  network: 'Não foi possível falar com o servidor. Verifique sua internet e tente de novo.',
  timeout: 'O servidor demorou demais para responder. Ele pode estar iniciando; tente de novo em instantes.',
  http: 'O servidor não conseguiu gerar a previsão agora. Tente de novo em alguns instantes.',
  parse: 'O servidor respondeu em um formato inesperado.',
  notFound: 'Não há previsão para este modelo nesta região. Tente escolher outro modelo.',
  noData:
    'A API não tem previsão para esse dia e horário: ela só cobre um período limitado. Veja as próximas previsões e escolha um horário que esteja na lista.',
  noModel: 'Nenhum modelo de previsão está disponível agora. Tente de novo em alguns instantes.',
  unknown: 'Algo deu errado ao buscar a previsão. Tente de novo.',
};
