# Coletor RIPE Atlas → API Java

Gera dados **reais** para a API Java (`trabalho-api-java`), no lugar do CSV de demonstração.

```
RIPE Atlas (pings reais)  →  coletor.py  →  predictions.csv + models.json  →  API Java  →  app PredictNet
```

A API Java não coleta nem calcula nada: ela só lê o `predictions.csv` (que é um arquivo de **previsões**, não de medições). Por isso o coletor faz as duas coisas: baixa as medições reais e calcula as previsões.

## O que ele faz

1. Lista as probes conectadas do país (`BR`) e escolhe as mais próximas da região de referência (São Paulo, a mesma do app).
2. Baixa os pings dos últimos dias da medição built-in **1001** (ping ao `k.root-servers.net`, a cada 4 minutos; cada ping manda 3 pacotes).
3. Soma por hora: latência média e porcentagem de pacotes perdidos. (Com só 3 pacotes por ping, a perda de um único ping seria 0, 33, 67 ou 100%; somar uma hora inteira deixa o número mais confiável.)
4. Calcula as próximas 24 horas com 4 modelos estatísticos simples:

| Modelo | Como prevê |
|---|---|
| Persistência | repete a última hora medida |
| Média de 24 horas | média das últimas 24 horas |
| Perfil por hora do dia | média daquela hora do dia nos dias medidos |
| Perfil ajustado | perfil por hora, corrigido pelas últimas 6 horas |

5. Grava os arquivos, **valida** com as mesmas regras da API Java e mostra um resumo.

## Como usar

Só precisa de Python 3.9 ou mais novo (não instala nada). No Windows, use `python` ou `py`.

```bash
cd tools/coletor-ripe-atlas
python coletor.py
```

Isso cria a pasta `saida/` com:
- `predictions.csv` e `models.json`: os arquivos da API Java;
- `medicoes_por_hora.csv`: as medições reais já somadas por hora (para conferir e mostrar na apresentação).

Para já copiar para o projeto Java (os arquivos originais viram `*.demo.bak`, uma única vez):

```bash
python coletor.py --api "C:\caminho\para\trabalho-api-java"
```

Depois, **reinicie a API** (ela só lê os arquivos ao iniciar):

```bash
cd trabalho-api-java
mvn spring-boot:run
```

Use `mvn spring-boot:run`, e não `mvn test`: o teste de contrato da API confere valores do CSV de demonstração e falharia com os dados reais.

Para voltar aos dados de demonstração, apague `data/predictions.csv` e `data/models.json` e renomeie os `*.demo.bak` de volta.

### Opções

| Opção | Padrão | Para quê |
|---|---|---|
| `--centro LAT,LON` | `-23.55,-46.63` | as probes mais próximas desse ponto são usadas |
| `--probes N` | 10 | quantas probes |
| `--dias N` | 7 | dias de histórico (máx. 30) |
| `--horas-a-frente N` | 24 | quantas horas prever (máx. 100) |
| `--medicao ID` | 1001 | outra medição de ping (ex.: 1004 = f-root) |
| `--min-horas N` | 12 | descarta probes com menos horas de dados |
| `--pais XX` | BR | país das probes |
| `--saida PASTA` | `saida` | onde gravar |
| `--api PASTA` | — | copia os arquivos para o projeto Java |

## Ligar o app à API local

O app lê a URL em `src/services/config.ts`. Para testar, troque `API_BASE_URL`:

- celular com Expo Go (PC e celular na **mesma rede Wi-Fi**): `http://IP_DO_PC:8080` (descubra o IP com `ipconfig`; o firewall do Windows pode pedir permissão para o Java);
- emulador Android: `http://10.0.2.2:8080`.

Antes de entregar, volte para `https://internet-quality-api.onrender.com`, se for esse o combinado com a professora.

## Cuidados e limitações (para falar na apresentação)

- **O que é medido:** latência e perda entre a *probe* e o servidor raiz K, e não a internet do celular de quem usa o app. O app já avisa isso na tela "Entenda esta previsão".
- **Os modelos são simples** e feitos para este projeto. Não são os modelos (joblib) de outros grupos. Se a professora indicar esses modelos, dá para acrescentar outra função em `MODELOS` no `coletor.py`.
- **A confiança** (`model_confidence`) é a cobertura dos dados (fração das horas pedidas que tem medição), e não uma probabilidade estatística.
- **Os dados envelhecem:** o CSV cobre as 24 horas seguintes à coleta. Rode o coletor e reinicie a API pouco antes de apresentar.
- **Privacidade:** o coletor grava só país, ASN e as coordenadas públicas (já aproximadas pelo RIPE Atlas). Os endereços IP das probes não entram nos arquivos.
- A API do Atlas é pública e não pede chave, mas tem limites de uso. Evite rodar o coletor muitas vezes seguidas.

## Testes

```bash
python -m unittest -v
```

Os testes não usam internet: simulam as respostas do Atlas no formato oficial ([formato dos resultados de ping](https://atlas.ripe.net/docs/apis/measurement-result-format/version-5000)).

## Fontes

- [RIPE Atlas — API de resultados](https://atlas.ripe.net/docs/apis/rest-api-manual/measurements/results)
- [RIPE Atlas — medições built-in](https://atlas.ripe.net/docs/built-in-measurements/)
- Ideia da ligação RIPE Atlas → API Java (coleta em Python ou Java, entregue em CSV): sugerida por um colega da turma.
