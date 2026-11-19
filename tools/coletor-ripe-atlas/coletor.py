#!/usr/bin/env python3
"""Coletor RIPE Atlas -> previsões para a API Java (predictions.csv + models.json).

O que faz, em ordem:
  1. Busca no RIPE Atlas (API pública, sem chave) as probes conectadas de um país, perto de uma região.
  2. Baixa os resultados de ping recentes dessas probes (por padrão, a medição built-in 1001: ping ao k.root-servers.net).
  3. Junta os resultados por hora: latência média e porcentagem de pacotes perdidos.
  4. Calcula, para as próximas horas, 4 previsões estatísticas simples (veja MODELOS abaixo).
  5. Grava `predictions.csv` e `models.json` no formato que a API Java (trabalho-api-java) lê.

Só usa a biblioteca padrão do Python (3.9 ou mais novo): não precisa instalar nada.
Os endereços IP das probes NUNCA vão para o CSV (a API Java recusa essas colunas).
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from statistics import mean
from typing import Callable, Dict, Iterable, List, Optional, Sequence, Tuple

ATLAS_API = "https://atlas.ripe.net/api/v2"
MEDICAO_PADRAO = 1001  # built-in: ping IPv4 ao k.root-servers.net, a cada 240 s
REFERENCIA_PADRAO = (-23.55, -46.63)  # São Paulo (a mesma região padrão do app)
USER_AGENT = "PredictNet-coletor/1.0 (projeto academico)"

# Colunas exigidas pela API Java (CsvForecastRepository). Não inclua endereços IP.
COLUNAS_CSV = [
    "prediction_id", "model_id", "model_version", "probe_id", "measurement_id", "country_code", "asn_v4", "asn_v6",
    "latitude", "longitude", "prediction_generated_at", "prediction_for", "predicted_avg_rtt_ms",
    "predicted_packet_loss_pct", "model_confidence",
]
COLUNAS_PROIBIDAS = {"src_addr", "from", "address_v4", "address_v6", "prefix_v4", "prefix_v6"}

# Limiares da API Java (QualityRules), usados só para o resumo impresso no fim.
RTT_REGULAR, RTT_INSTAVEL = 60.0, 150.0
PERDA_REGULAR, PERDA_INSTAVEL = 1.0, 5.0


# --------------------------------------------------------------------------- dados

@dataclass(frozen=True)
class Probe:
    id: int
    pais: str
    asn_v4: Optional[int]
    asn_v6: Optional[int]
    latitude: float
    longitude: float


@dataclass(frozen=True)
class Hora:
    """Uma hora (UTC) de medições de uma probe, já somadas."""
    inicio: datetime
    rtt_ms: Optional[float]  # None quando nenhum pacote voltou
    perda_pct: float
    pacotes: int


class ErroColeta(Exception):
    pass


# --------------------------------------------------------------------------- RIPE Atlas

def baixar_json(url: str, tentativas: int = 4, espera: float = 2.0, timeout: float = 120.0):
    """GET com tentativas. Os resultados do Atlas podem ser grandes e demorar: por isso o timeout generoso."""
    ultimo: Optional[Exception] = None
    for tentativa in range(1, tentativas + 1):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as resposta:
                return json.loads(resposta.read().decode("utf-8"))
        except urllib.error.HTTPError as erro:
            ultimo = erro
            if erro.code in (400, 401, 403, 404):  # não adianta tentar de novo
                break
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError) as erro:
            ultimo = erro
        if tentativa < tentativas:
            time.sleep(espera * tentativa)
    raise ErroColeta(f"Não consegui acessar {url}: {ultimo}")


def probe_de_json(item: dict) -> Optional[Probe]:
    """Converte uma probe do Atlas. Devolve None se estiver offline, privada ou sem coordenadas."""
    try:
        status = (item.get("status") or {}).get("id")
        if status != 1 or item.get("is_public") is False:  # 1 = Connected
            return None
        coords = (item.get("geometry") or {}).get("coordinates")
        if not coords or len(coords) < 2:
            return None
        longitude, latitude = float(coords[0]), float(coords[1])  # o Atlas usa [longitude, latitude]
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return None
        return Probe(
            id=int(item["id"]),
            pais=str(item.get("country_code") or "").upper(),
            asn_v4=int(item["asn_v4"]) if item.get("asn_v4") is not None else None,
            asn_v6=int(item["asn_v6"]) if item.get("asn_v6") is not None else None,
            latitude=latitude,
            longitude=longitude,
        )
    except (KeyError, TypeError, ValueError):
        return None


def listar_probes(pais: str, baixar: Callable[[str], object] = baixar_json) -> List[Probe]:
    consulta = urllib.parse.urlencode({"country_code": pais, "status": 1, "is_public": "true", "page_size": 500})
    url: Optional[str] = f"{ATLAS_API}/probes/?{consulta}"
    probes: List[Probe] = []
    paginas = 0
    while url and paginas < 50:
        pagina = baixar(url)
        if not isinstance(pagina, dict):
            raise ErroColeta("Resposta inesperada da lista de probes.")
        for item in pagina.get("results") or []:
            probe = probe_de_json(item)
            if probe is not None:
                probes.append(probe)
        url = pagina.get("next")
        paginas += 1
    return probes


def distancia_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(min(1.0, max(0.0, a))))


def mais_proximas(probes: Sequence[Probe], centro: Tuple[float, float], quantas: int) -> List[Probe]:
    return sorted(probes, key=lambda p: distancia_km(centro[0], centro[1], p.latitude, p.longitude))[:quantas]


def baixar_resultados(
    medicao: int, ids: Sequence[int], inicio: int, fim: int, lote: int = 10,
    baixar: Callable[[str], object] = baixar_json,
) -> List[dict]:
    """Resultados de ping da medição. `inicio` e `fim` são timestamps Unix. Vai em lotes de probes."""
    todos: List[dict] = []
    for i in range(0, len(ids), lote):
        parte = ids[i:i + lote]
        consulta = urllib.parse.urlencode({"start": inicio, "stop": fim, "probe_ids": ",".join(map(str, parte))})
        dados = baixar(f"{ATLAS_API}/measurements/{medicao}/results/?{consulta}")
        if not isinstance(dados, list):
            raise ErroColeta("Os resultados do Atlas vieram em formato inesperado (esperava uma lista).")
        todos.extend(item for item in dados if isinstance(item, dict))
    return todos


# --------------------------------------------------------------------------- agregação por hora

def rtt_do_resultado(r: dict) -> Optional[float]:
    """Latência média de um resultado de ping, ou None se nenhum pacote voltou."""
    recebidos = r.get("rcvd")
    if not isinstance(recebidos, int) or recebidos <= 0:
        return None
    media = r.get("avg")
    if isinstance(media, (int, float)) and media >= 0:
        return float(media)
    rtts = [p["rtt"] for p in r.get("result") or [] if isinstance(p, dict) and isinstance(p.get("rtt"), (int, float))]
    return float(mean(rtts)) if rtts else None


def agrupar_por_hora(resultados: Iterable[dict]) -> Dict[int, List[Hora]]:
    """{id da probe: horas em ordem}. Resultados inválidos são ignorados."""
    soma: Dict[Tuple[int, int], List[float]] = {}  # (probe, hora) -> [enviados, recebidos, soma rtt*rcvd, rcvd com rtt]
    for r in resultados:
        try:
            probe, instante, enviados = int(r["prb_id"]), int(r["timestamp"]), int(r["sent"])
        except (KeyError, TypeError, ValueError):
            continue
        recebidos = r.get("rcvd")
        if enviados <= 0 or not isinstance(recebidos, int) or recebidos < 0:
            continue
        recebidos = min(recebidos, enviados)  # "rcvd" pode contar duplicatas
        acc = soma.setdefault((probe, instante // 3600 * 3600), [0, 0, 0.0, 0])
        acc[0] += enviados
        acc[1] += recebidos
        rtt = rtt_do_resultado({**r, "rcvd": recebidos})
        if rtt is not None:
            acc[2] += rtt * recebidos
            acc[3] += recebidos

    por_probe: Dict[int, List[Hora]] = {}
    for (probe, hora), (enviados, recebidos, soma_rtt, com_rtt) in sorted(soma.items()):
        por_probe.setdefault(probe, []).append(Hora(
            inicio=datetime.fromtimestamp(hora, tz=timezone.utc),
            rtt_ms=soma_rtt / com_rtt if com_rtt else None,
            perda_pct=100.0 * (enviados - recebidos) / enviados,
            pacotes=int(enviados),
        ))
    return por_probe


# --------------------------------------------------------------------------- modelos

Previsao = Tuple[float, float]  # (rtt_ms, perda_pct)
Modelo = Callable[[Sequence[Hora], Sequence[datetime]], List[Previsao]]


def _limitar(rtt: float, perda: float) -> Previsao:
    return round(max(0.1, rtt), 1), round(min(100.0, max(0.0, perda)), 2)


def _medias(horas: Sequence[Hora], padrao_rtt: float = 0.0) -> Previsao:
    rtts = [h.rtt_ms for h in horas if h.rtt_ms is not None]
    return (mean(rtts) if rtts else padrao_rtt), (mean(h.perda_pct for h in horas) if horas else 0.0)


def modelo_persistencia(historico: Sequence[Hora], alvos: Sequence[datetime]) -> List[Previsao]:
    """A previsão é a última hora medida, repetida."""
    com_rtt = [h for h in historico if h.rtt_ms is not None]
    rtt = com_rtt[-1].rtt_ms if com_rtt else 0.0
    return [_limitar(rtt, historico[-1].perda_pct)] * len(alvos)


def modelo_media_24h(historico: Sequence[Hora], alvos: Sequence[datetime]) -> List[Previsao]:
    """A previsão é a média das últimas 24 horas medidas."""
    rtt, perda = _medias(historico[-24:])
    return [_limitar(rtt, perda)] * len(alvos)


def _perfil(historico: Sequence[Hora]) -> Dict[int, Previsao]:
    """Média de cada hora do dia (UTC) em todo o histórico. Horas com menos de 2 amostras usam a média geral."""
    geral = _medias(historico)
    perfil: Dict[int, Previsao] = {}
    for hora in range(24):
        amostras = [h for h in historico if h.inicio.hour == hora]
        perfil[hora] = _medias(amostras, geral[0]) if len(amostras) >= 2 else geral
    return perfil


def modelo_perfil_horario(historico: Sequence[Hora], alvos: Sequence[datetime]) -> List[Previsao]:
    """A previsão é o comportamento médio daquela hora do dia nos dias medidos."""
    perfil = _perfil(historico)
    return [_limitar(*perfil[alvo.hour]) for alvo in alvos]


def modelo_perfil_ajustado(historico: Sequence[Hora], alvos: Sequence[datetime]) -> List[Previsao]:
    """Perfil por hora do dia, corrigido pelo quanto as últimas 6 horas fugiram do perfil (tendência recente)."""
    perfil = _perfil(historico)
    recentes = historico[-6:]
    rtt_real, perda_real = _medias(recentes)
    rtt_esperado = mean(perfil[h.inicio.hour][0] for h in recentes)
    perda_esperada = mean(perfil[h.inicio.hour][1] for h in recentes)
    fator = min(2.0, max(0.5, rtt_real / rtt_esperado)) if rtt_esperado > 0 else 1.0
    deslocamento = perda_real - perda_esperada
    return [_limitar(perfil[a.hour][0] * fator, perfil[a.hour][1] + deslocamento) for a in alvos]


# id, nome, algoritmo, descrição, função
MODELOS: List[Tuple[str, str, str, str, Modelo]] = [
    ("ripe-persistencia", "Persistência", "Última medição repetida",
     "Repete a última hora medida pelo RIPE Atlas. É o modelo mais simples e serve de referência.",
     modelo_persistencia),
    ("ripe-media-24h", "Média de 24 horas", "Média móvel",
     "Usa a média das últimas 24 horas medidas pelo RIPE Atlas.",
     modelo_media_24h),
    ("ripe-perfil-horario", "Perfil por hora do dia", "Média por hora do dia",
     "Prevê cada hora pelo comportamento médio daquela hora nos dias medidos pelo RIPE Atlas.",
     modelo_perfil_horario),
    ("ripe-perfil-ajustado", "Perfil ajustado", "Média por hora do dia + tendência recente",
     "Perfil por hora do dia corrigido pelas últimas 6 horas medidas pelo RIPE Atlas.",
     modelo_perfil_ajustado),
]


def catalogo_modelos(agora: datetime) -> List[dict]:
    """Conteúdo do models.json (mesmos campos do catálogo original da API)."""
    criado = agora.strftime("%Y-%m-%dT%H:%M:%SZ")
    return [
        {"id": mid, "name": nome, "description": desc, "groupName": "Compyuter's", "algorithm": algoritmo,
         "version": "1.0", "active": True, "createdAt": criado}
        for mid, nome, algoritmo, desc, _ in MODELOS
    ]


# --------------------------------------------------------------------------- saída

def iso(instante: datetime) -> str:
    return instante.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def proxima_hora(agora: datetime) -> datetime:
    return agora.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)


def montar_linhas(
    historicos: Dict[int, List[Hora]], probes: Dict[int, Probe], medicao: int, agora: datetime,
    horas_a_frente: int, dias_historico: int,
) -> List[dict]:
    primeiro = proxima_hora(agora)
    alvos = [primeiro + timedelta(hours=i) for i in range(horas_a_frente)]
    linhas: List[dict] = []
    for probe_id in sorted(historicos):
        historico, probe = historicos[probe_id], probes[probe_id]
        # Confiança = quanto do período pedido tem medição (cobertura dos dados), e não uma probabilidade estatística.
        confianca = round(min(1.0, len(historico) / (dias_historico * 24)), 2)
        for mid, _nome, _alg, _desc, funcao in MODELOS:
            for indice, (alvo, (rtt, perda)) in enumerate(zip(alvos, funcao(historico, alvos))):
                linhas.append({
                    "prediction_id": f"{mid}-{probe_id}-{indice:02d}",
                    "model_id": mid,
                    "model_version": "1.0",
                    "probe_id": probe_id,
                    "measurement_id": medicao,
                    "country_code": probe.pais,
                    "asn_v4": "" if probe.asn_v4 is None else probe.asn_v4,
                    "asn_v6": "" if probe.asn_v6 is None else probe.asn_v6,
                    "latitude": round(probe.latitude, 4),
                    "longitude": round(probe.longitude, 4),
                    "prediction_generated_at": iso(agora),
                    "prediction_for": iso(alvo),
                    "predicted_avg_rtt_ms": rtt,
                    "predicted_packet_loss_pct": perda,
                    "model_confidence": confianca,
                })
    return linhas


def gravar(pasta: Path, linhas: List[dict], agora: datetime, historicos: Dict[int, List[Hora]]) -> Dict[str, Path]:
    pasta.mkdir(parents=True, exist_ok=True)
    caminhos = {
        "csv": pasta / "predictions.csv",
        "modelos": pasta / "models.json",
        "horas": pasta / "medicoes_por_hora.csv",
    }
    with caminhos["csv"].open("w", encoding="utf-8", newline="") as f:
        escritor = csv.DictWriter(f, fieldnames=COLUNAS_CSV, lineterminator="\n")
        escritor.writeheader()
        escritor.writerows(linhas)
    caminhos["modelos"].write_text(json.dumps(catalogo_modelos(agora), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # Medições reais já somadas por hora: serve para conferir (e mostrar) de onde vêm as previsões.
    with caminhos["horas"].open("w", encoding="utf-8", newline="") as f:
        escritor = csv.writer(f, lineterminator="\n")
        escritor.writerow(["probe_id", "hora_utc", "rtt_medio_ms", "perda_pct", "pacotes_enviados"])
        for probe_id in sorted(historicos):
            for h in historicos[probe_id]:
                escritor.writerow([probe_id, iso(h.inicio), "" if h.rtt_ms is None else round(h.rtt_ms, 2),
                                   round(h.perda_pct, 2), h.pacotes])
    return caminhos


def instalar_na_api(pasta_api: Path, caminhos: Dict[str, Path]) -> List[Path]:
    """Copia predictions.csv e models.json para a pasta `data/` do projeto Java.

    Guarda os arquivos originais (dados de demonstração) como `*.demo.bak`, uma única vez, para dar para voltar.
    """
    destino = pasta_api / "data"
    if not (pasta_api / "pom.xml").exists() or not destino.is_dir():
        raise ErroColeta(f"'{pasta_api}' não parece ser a pasta do projeto Java (esperava pom.xml e a pasta data/).")
    copiados: List[Path] = []
    for chave, nome in (("csv", "predictions.csv"), ("modelos", "models.json")):
        alvo = destino / nome
        backup = destino / (nome + ".demo.bak")
        if alvo.exists() and not backup.exists():
            shutil.copy2(alvo, backup)
        shutil.copy2(caminhos[chave], alvo)
        copiados.append(alvo)
    return copiados


# --------------------------------------------------------------------------- validação (espelha a API Java)

def validar(csv_path: Path, modelos_path: Path) -> List[str]:
    """Aplica as mesmas regras do CsvForecastRepository. Devolve a lista de problemas (vazia = ok)."""
    problemas: List[str] = []
    try:
        ids_modelos = {m["id"] for m in json.loads(modelos_path.read_text(encoding="utf-8"))}
    except (OSError, ValueError, KeyError, TypeError) as erro:
        return [f"models.json inválido: {erro}"]
    with csv_path.open(encoding="utf-8", newline="") as f:
        leitor = csv.DictReader(f)
        cabecalho = leitor.fieldnames or []
        faltando = [c for c in COLUNAS_CSV if c not in cabecalho]
        if faltando:
            return [f"faltam colunas: {', '.join(faltando)}"]
        proibidas = [c for c in cabecalho if c in COLUNAS_PROIBIDAS]
        if proibidas:
            return [f"colunas proibidas: {', '.join(proibidas)}"]
        instantes: Dict[Tuple[str, str], set] = {}
        total = 0
        for numero, linha in enumerate(leitor, start=2):
            total += 1
            try:
                lat, lon = float(linha["latitude"]), float(linha["longitude"])
                rtt, perda = float(linha["predicted_avg_rtt_ms"]), float(linha["predicted_packet_loss_pct"])
                if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                    raise ValueError("coordenadas fora do intervalo")
                if rtt < 0 or perda < 0 or not math.isfinite(rtt) or not math.isfinite(perda):
                    raise ValueError("métricas negativas ou inválidas")
                if linha["model_confidence"] != "" and not 0 <= float(linha["model_confidence"]) <= 1:
                    raise ValueError("model_confidence fora de 0..1")
                int(linha["probe_id"]), int(linha["measurement_id"])
                datetime.strptime(linha["prediction_for"], "%Y-%m-%dT%H:%M:%SZ")
                datetime.strptime(linha["prediction_generated_at"], "%Y-%m-%dT%H:%M:%SZ")
                if not linha["prediction_id"] or not linha["country_code"]:
                    raise ValueError("campo obrigatório vazio")
            except (ValueError, KeyError) as erro:
                problemas.append(f"linha {numero}: {erro}")
                continue
            if linha["model_id"] not in ids_modelos:
                problemas.append(f"linha {numero}: model_id '{linha['model_id']}' não está no models.json")
            instantes.setdefault((linha["model_id"], linha["probe_id"]), set()).add(linha["prediction_for"])
    if total == 0:
        problemas.append("o CSV não tem linhas")
    # A tela "Comparar modelos" precisa de um instante comum a todos os modelos da mesma probe.
    por_probe: Dict[str, List[set]] = {}
    for (_modelo, probe), horas in instantes.items():
        por_probe.setdefault(probe, []).append(horas)
    for probe, conjuntos in por_probe.items():
        if len(conjuntos) != len(ids_modelos) or not set.intersection(*conjuntos):
            problemas.append(f"probe {probe}: os modelos não têm horários em comum")
    return problemas


def classificar(rtt: float, perda: float) -> str:
    def nivel(valor: float, regular: float, instavel: float) -> int:
        return 0 if valor >= instavel else 1 if valor >= regular else 2  # 0 instável, 1 regular, 2 boa
    return ["INSTÁVEL", "REGULAR", "BOA"][min(nivel(rtt, RTT_REGULAR, RTT_INSTAVEL), nivel(perda, PERDA_REGULAR, PERDA_INSTAVEL))]


# --------------------------------------------------------------------------- programa principal

def interpretar_centro(texto: str) -> Tuple[float, float]:
    try:
        lat, lon = (float(parte) for parte in texto.split(","))
    except ValueError:
        raise argparse.ArgumentTypeError("use o formato LATITUDE,LONGITUDE, por exemplo -23.55,-46.63")
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise argparse.ArgumentTypeError("coordenadas fora do intervalo")
    return lat, lon


def argumentos(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Gera predictions.csv e models.json a partir de medições reais do RIPE Atlas.")
    p.add_argument("--pais", default="BR", help="código do país das probes (padrão: BR)")
    p.add_argument("--centro", type=interpretar_centro, default=REFERENCIA_PADRAO,
                   help="LATITUDE,LONGITUDE: as probes mais próximas daqui são usadas (padrão: São Paulo)")
    p.add_argument("--probes", type=int, default=10, help="quantas probes usar (padrão: 10)")
    p.add_argument("--dias", type=int, default=7, help="quantos dias de histórico baixar (padrão: 7)")
    p.add_argument("--horas-a-frente", type=int, default=24, help="quantas horas prever (padrão: 24)")
    p.add_argument("--medicao", type=int, default=MEDICAO_PADRAO, help=f"id da medição de ping (padrão: {MEDICAO_PADRAO})")
    p.add_argument("--min-horas", type=int, default=12, help="mínimo de horas com dados para usar uma probe (padrão: 12)")
    p.add_argument("--saida", type=Path, default=Path("saida"), help="pasta onde gravar os arquivos (padrão: ./saida)")
    p.add_argument("--api", type=Path, default=None, metavar="PASTA_DO_PROJETO_JAVA",
                   help="se informada, copia predictions.csv e models.json para a pasta data/ do projeto Java "
                        "(os originais viram *.demo.bak)")
    args = p.parse_args(argv)
    if args.probes < 1 or args.dias < 1 or args.horas_a_frente < 1 or args.min_horas < 1:
        p.error("--probes, --dias, --horas-a-frente e --min-horas devem ser maiores que zero")
    if args.dias > 30:
        p.error("--dias: use no máximo 30 (a coleta fica lenta e o ganho é pequeno)")
    if args.horas_a_frente > 100:
        p.error("--horas-a-frente: a API Java devolve no máximo 100 previsões por consulta")
    return args


def executar(args: argparse.Namespace, baixar: Callable[[str], object] = baixar_json,
             agora: Optional[datetime] = None) -> Dict[str, Path]:
    agora = (agora or datetime.now(timezone.utc)).replace(microsecond=0)
    print(f"1/4 Buscando probes conectadas em {args.pais}…")
    todas = listar_probes(args.pais, baixar)
    if not todas:
        raise ErroColeta(f"Nenhuma probe pública conectada encontrada em {args.pais}.")
    candidatas = mais_proximas(todas, args.centro, args.probes * 3)  # sobra para descartar as sem dados
    print(f"    {len(todas)} probes; baixando medições de {len(candidatas)} candidatas perto de {args.centro}…")

    print(f"2/4 Baixando {args.dias} dia(s) de ping (medição {args.medicao})…")
    fim = int(agora.timestamp())
    resultados = baixar_resultados(args.medicao, [p.id for p in candidatas], fim - args.dias * 86400, fim, baixar=baixar)
    print(f"    {len(resultados)} resultados recebidos.")

    print("3/4 Somando por hora…")
    por_probe = agrupar_por_hora(resultados)
    por_id = {p.id: p for p in candidatas}
    escolhidas: Dict[int, List[Hora]] = {}
    for probe in candidatas:  # já está em ordem de distância
        horas = por_probe.get(probe.id, [])
        if sum(1 for h in horas if h.rtt_ms is not None) >= args.min_horas and len(escolhidas) < args.probes:
            escolhidas[probe.id] = horas
    if not escolhidas:
        raise ErroColeta(
            f"Nenhuma probe tem pelo menos {args.min_horas} horas de medição. "
            "Tente --dias maior, --min-horas menor ou outro --centro."
        )
    print(f"    {len(escolhidas)} probes com dados suficientes.")

    print("4/4 Calculando previsões e gravando arquivos…")
    linhas = montar_linhas(escolhidas, por_id, args.medicao, agora, args.horas_a_frente, args.dias)
    caminhos = gravar(args.saida, linhas, agora, escolhidas)
    problemas = validar(caminhos["csv"], caminhos["modelos"])
    if problemas:
        raise ErroColeta("Os arquivos gerados não passam na validação:\n  " + "\n  ".join(problemas[:10]))

    contagem = {"BOA": 0, "REGULAR": 0, "INSTÁVEL": 0}
    for linha in linhas:
        contagem[classificar(linha["predicted_avg_rtt_ms"], linha["predicted_packet_loss_pct"])] += 1
    print(f"\nPronto: {len(linhas)} previsões, {len(MODELOS)} modelos, {len(escolhidas)} probes.")
    print("Qualidade prevista: " + ", ".join(f"{k} {100 * v / len(linhas):.0f}%" for k, v in contagem.items()))
    for caminho in caminhos.values():
        print(f"  {caminho}")
    if args.api is not None:
        for caminho in instalar_na_api(args.api, caminhos):
            print(f"  copiado para {caminho}")
        print("Reinicie a API Java para ela carregar os dados novos (mvn spring-boot:run).")
    return caminhos


def main(argv: Optional[Sequence[str]] = None) -> int:
    try:
        executar(argumentos(argv))
    except ErroColeta as erro:
        print(f"\nErro: {erro}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
