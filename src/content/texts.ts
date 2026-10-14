// TEXTOS — mensagens e glossário. Termos técnicos explicados em linguagem simples (RNF07).
import type { ApiErrorKind, IndicatorKind, Level, Quality } from '../types';

export const QUALITY_SUMMARY: Record<Quality, string> = {
  BOA: 'Sua conexão deve funcionar bem neste horário.',
  REGULAR: 'Sua conexão pode apresentar variações neste horário.',
  'INSTÁVEL': 'Sua conexão pode ser instável neste horário.',
};

export const QUALITY_MEANING: Record<Quality, string> = {
  BOA: 'A conexão deve apresentar boa estabilidade neste período e ser adequada para atividades que dependem de uma conexão estável.',
  REGULAR:
    'A conexão pode variar neste período. Atividades mais leves como navegação e streaming devem funcionar, mas chamadas de vídeo podem ter instabilidades.',
  'INSTÁVEL':
    'A conexão pode apresentar problemas significativos neste período. Recomendamos aguardar um horário mais estável para atividades importantes.',
};

export const ACTIVITY_VERDICT: Record<Quality, string> = {
  BOA: 'Esta atividade deve funcionar bem neste período. A previsão indica uma conexão com boa estabilidade.',
  REGULAR: 'Esta atividade pode apresentar variações de qualidade neste período. Pode funcionar, mas com algumas instabilidades.',
  'INSTÁVEL':
    'Esta atividade pode ser difícil neste período. Recomendamos tentar em outro horário ou escolher uma atividade mais leve.',
};

export const DEMANDING_ACTIVITY_NOTE =
  'Videoconferência e jogos online exigem mais da conexão. Por isso o resultado é mais rigoroso do que a previsão geral do horário.';

export const GLOSSARY: Record<IndicatorKind, { label: string; shortLabel: string; hint: string }> = {
  latency: {
    label: 'Latência prevista',
    shortLabel: 'Latência',
    hint: 'Latência é o tempo que os dados levam para chegar ao destino — quanto menor, melhor.',
  },
  jitter: {
    label: 'Jitter previsto',
    shortLabel: 'Jitter',
    hint: 'Jitter indica variações no tempo de comunicação. Jitter alto pode causar travamentos.',
  },
  loss: {
    label: 'Perda de pacotes',
    shortLabel: 'Perda de pacotes',
    hint: 'Indica dados que podem não chegar ao destino, causando erros ou lentidão.',
  },
};

export const LEVEL_LABEL: Record<IndicatorKind, Record<Level, string>> = {
  latency: { low: 'Baixa', medium: 'Média', high: 'Alta' },
  jitter: { low: 'Baixo', medium: 'Médio', high: 'Alto' },
  loss: { low: 'Baixa', medium: 'Média', high: 'Alta' },
};

export const ERROR_TEXT: Record<ApiErrorKind | 'unknown', string> = {
  network: 'Não foi possível falar com o servidor. Verifique sua internet e tente de novo.',
  timeout: 'O servidor demorou demais para responder. Tente de novo.',
  http: 'O servidor não conseguiu gerar a previsão agora. Tente de novo em alguns instantes.',
  parse: 'O servidor respondeu em um formato inesperado.',
  unknown: 'Algo deu errado ao buscar a previsão. Tente de novo.',
};

export const MOCK_NOTICE = 'Dados de exemplo. A API ainda não está conectada.';
