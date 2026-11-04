# Compyuter's — Previsão de Qualidade de Internet

Aplicativo mobile que mostra **como a conexão de internet deve estar** em uma região, em um dia e horário escolhidos, e se ela serve para uma atividade (chamada de vídeo, streaming, envio de arquivos etc.). O resultado vem sempre em linguagem simples: conexão **Boa**, **Regular** ou **Instável**.

Projeto acadêmico — ADS, 4º semestre (projeto integrador com a disciplina de Redes). Feito em **React Native + Expo + TypeScript**.

> As previsões vêm de uma API educacional com dados pré-calculados. O app **não mede** a internet do aparelho e não representa uma medição direta dele. Esse aviso aparece na tela "Entenda esta previsão".

## O que o app faz

- **Previsão para a sua região:** qualidade esperada (Boa, Regular ou Instável), latência e perda de pacotes, com uma recomendação de uso.
- **Escolher outro horário:** consulta a previsão para a data e hora desejadas.
- **Próximas previsões:** lista de horários seguidos; tocar em um deles abre a previsão daquele horário.
- **Planejar uma atividade:** diz se a conexão deve servir para chamada de vídeo, chamada de áudio, streaming, envio de arquivos, navegação ou mensagens.
- **Escolher o modelo de previsão:** a lista de modelos vem da API, então modelos novos aparecem sozinhos.
- **Entenda esta previsão:** explica o que é latência e perda de pacotes e o que a previsão representa.
- **Localização opcional:** por padrão usa São Paulo como referência. A localização do aparelho só é pedida quando a pessoa toca em "Usar minha localização" e é arredondada (cerca de 1 km). Nada é guardado.
- **VLibras:** tradução do texto das telas para Libras (veja "Acessibilidade").

## Tecnologias

| | |
|---|---|
| App | React Native com Expo, TypeScript (`strict`) |
| Bibliotecas | `expo-location`, `expo-status-bar`, `react-native-safe-area-context`, `react-native-webview` |
| Dados | [Internet Quality API](https://internet-quality-api.onrender.com/docs) |
| Acessibilidade | [VLibras](https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/vlibras) (Governo Federal) |

## Como rodar

Este repositório tem o código-fonte (`App.tsx` e a pasta `src/`). Para executar, coloque-o em um projeto Expo:

```bash
npx create-expo-app@latest compyuters --template blank-typescript
cd compyuters
npx expo install expo-location expo-status-bar react-native-safe-area-context react-native-webview
```

Depois copie o `App.tsx` e a pasta `src/` deste repositório para dentro do projeto, substituindo o `App.tsx` que veio no modelo, e inicie:

```bash
npx expo start
```

- **Celular:** leia o QR code que aparece no terminal com o aplicativo **Expo Go**.
- **Navegador:** rode `npx expo install react-dom react-native-web` e depois `npx expo start --web`.
- **Expo Snack:** envie os arquivos para o Snack e adicione as dependências acima em "Add dependency".

Atenção à versão: o Expo Go das lojas só abre projetos de uma versão do SDK (a mais nova). O app foi desenvolvido e testado no Snack com **SDK 54**. Se aparecer erro de versão, veja [Expo Go version mismatch](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/). Em SDKs mais novos o app usa só recursos estáveis, mas não foi testado neles.

## Estrutura do projeto

O `App.tsx` só decide qual tela mostrar. Design, regras, dados e textos ficam separados em `src/`:

```
App.tsx                  ponto de entrada (troca de telas)
src/
├── screens/             as 7 telas: início, horário, atividade, resultado, modelos, próximas previsões, sobre
├── components/          peças visuais reutilizáveis (botão, selo de qualidade, seletor de hora…)
├── theme/               cores, tamanhos e estilos comuns (design)
├── content/texts.ts     todos os textos: mensagens, glossário, erros, textos do VLibras
├── constants/           ícones e lista de atividades
├── hooks/               estado do app, consultas à API, localização do aparelho
├── logic/               regras puras: escolha do modelo, conversão de horários
├── services/            comunicação com a API: cliente HTTP, validação das respostas, cache
├── accessibility/       VLibras (navegador e celular)
├── types/               tipos TypeScript
└── utils/               formatação de números e datas
```

## Como a API é usada

A URL base é `https://internet-quality-api.onrender.com/api/v1`. O app usa só o que faz sentido para os requisitos:

| Endpoint | Para quê |
|---|---|
| `GET /models` | lista de modelos de previsão |
| `GET /forecasts/nearby` | previsão mais próxima para a latitude e longitude |
| `GET /forecasts/probes/{id}/timeline` | previsão em um horário e lista de próximas previsões |
| `POST /activity/check` | se uma atividade é adequada em um horário |

Cuidados do cliente HTTP:
- As respostas são **validadas**: se vierem em formato inesperado, o app mostra uma mensagem clara em vez de quebrar.
- Há **tempo limite** e **cache** (5 minutos para previsões, 30 para a lista de modelos).
- O plano gratuito do servidor "dorme" quando fica parado: a primeira consulta pode levar cerca de **1 minuto**, e o app avisa quando isso acontece.
- Os horários são escolhidos no fuso do aparelho e enviados à API em UTC.
- A API não informa **jitter**, então o app mostra latência e perda de pacotes.

## Acessibilidade

O app segue os requisitos de acessibilidade do projeto: textos em linguagem simples, alvos de toque de pelo menos 48 dp, informação que não depende só de cor (a qualidade tem ícone e texto), glossário para latência e perda de pacotes, e rótulos para leitores de tela.

**VLibras** (tradutor de português para Libras):
- **No celular:** um botão "Libras" abre uma janela com o avatar. O widget roda dentro de uma `WebView` com o texto da tela atual, e a navegação é limitada a páginas `vlibras.gov.br`. Precisa de internet e o desempenho varia conforme o aparelho.
- **No navegador (Expo Web):** entra o widget oficial do VLibras na página.
- O widget envia à API do VLibras o texto que a pessoa toca para traduzir. A tradução é automática e **não substitui um intérprete de Libras**.

## Limitações conhecidas

- **Os dados são educacionais.** A API devolve previsões pré-calculadas, e não medições em tempo real. Quando os dados da API cobrem só um período fixo, um horário fora dele mostra um aviso, com a opção "Ver a próxima previsão".
- **Sem teste de rede no aparelho.** O app mostra previsões da API e não executa testes de latência, jitter ou perda de pacotes no celular.
- Não há testes automatizados no repositório.

## Referências

- [Documentação da API](https://internet-quality-api.onrender.com/docs)
- [VLibras — Governo Digital](https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/vlibras)
- [Expo](https://docs.expo.dev/)
