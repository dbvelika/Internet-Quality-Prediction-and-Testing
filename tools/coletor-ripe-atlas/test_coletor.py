"""Testes do coletor, sem internet: o Atlas é simulado com respostas no formato oficial.

Rodar:  python -m unittest -v      (dentro de tools/coletor-ripe-atlas)
"""
import csv
import io
import json
import math
import tempfile
import unittest
import urllib.error
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

import coletor as c

AGORA = datetime(2026, 11, 19, 12, 34, 56, tzinfo=timezone.utc)


def probe_json(pid, lat, lon, status=1, publica=True, pais="BR", asn=28573):
    return {"id": pid, "country_code": pais, "asn_v4": asn, "asn_v6": None, "is_public": publica,
            "status": {"id": status, "name": "Connected" if status == 1 else "Disconnected"},
            "geometry": {"type": "Point", "coordinates": [lon, lat]}}


def ping(prb, ts, sent=3, rcvd=3, avg=20.0, rtts=None):
    resultado = [{"rtt": avg}] * rcvd + [{"x": "*"}] * (sent - rcvd)
    return {"fw": 5020, "type": "ping", "msm_id": 1001, "prb_id": prb, "timestamp": ts, "sent": sent, "rcvd": rcvd,
            "avg": avg if rcvd else -1, "min": avg, "max": avg, "src_addr": "10.0.0.1", "from": "200.1.1.1",
            "result": resultado if rtts is None else [{"rtt": x} for x in rtts]}


def serie(prb, dias=7, base=30.0, fim=AGORA):
    """Um ping a cada 240 s, com latência maior à noite (hora UTC 22-02) e perda só às 23h."""
    out = []
    t = int(fim.timestamp()) - dias * 86400
    while t < int(fim.timestamp()):
        hora = datetime.fromtimestamp(t, tz=timezone.utc).hour
        avg = base + (40.0 if hora in (22, 23, 0, 1, 2) else 0.0)
        rcvd = 2 if hora == 23 and (t // 240) % 2 == 0 else 3
        out.append(ping(prb, t, 3, rcvd, avg))
        t += 240
    return out


class AtlasFalso:
    """Responde às URLs do Atlas usadas pelo coletor."""

    def __init__(self, probes, resultados, paginar=False):
        self.probes, self.resultados, self.paginar, self.urls = probes, resultados, paginar, []

    def __call__(self, url):
        self.urls.append(url)
        if "/probes/" in url:
            if self.paginar and "pagina=2" not in url:
                return {"count": len(self.probes), "next": url + "&pagina=2", "results": self.probes[:2]}
            return {"count": len(self.probes), "next": None, "results": self.probes[2:] if self.paginar else self.probes}
        if "/measurements/" in url and "/results/" in url:
            ids = set(map(int, url.split("probe_ids=")[1].split("&")[0].replace("%2C", ",").split(",")))
            return [r for r in self.resultados if r["prb_id"] in ids]
        raise AssertionError(f"URL inesperada: {url}")


class Probes(unittest.TestCase):
    def test_coordenadas_sao_longitude_latitude(self):
        p = c.probe_de_json(probe_json(1, -23.5, -46.6))
        self.assertEqual((p.latitude, p.longitude), (-23.5, -46.6))

    def test_descarta_offline_privada_e_sem_coordenadas(self):
        self.assertIsNone(c.probe_de_json(probe_json(1, 0, 0, status=2)))
        self.assertIsNone(c.probe_de_json(probe_json(1, 0, 0, publica=False)))
        sem = probe_json(1, 0, 0)
        sem["geometry"] = None
        self.assertIsNone(c.probe_de_json(sem))
        self.assertIsNone(c.probe_de_json({"id": "x"}))

    def test_paginacao_e_ordem_por_distancia(self):
        lista = [probe_json(1, -3.7, -38.5), probe_json(2, -23.6, -46.7), probe_json(3, -30.0, -51.2),
                 probe_json(4, -22.9, -43.2), probe_json(5, 0, 0, status=3)]
        probes = c.listar_probes("BR", AtlasFalso(lista, [], paginar=True))
        self.assertEqual(len(probes), 4)
        proximas = c.mais_proximas(probes, c.REFERENCIA_PADRAO, 2)
        self.assertEqual([p.id for p in proximas], [2, 4])  # São Paulo, depois Rio


class Agregacao(unittest.TestCase):
    def test_media_ponderada_e_perda(self):
        t = int(datetime(2026, 11, 19, 10, 0, tzinfo=timezone.utc).timestamp())
        horas = c.agrupar_por_hora([ping(7, t + 10, 3, 3, 10.0), ping(7, t + 250, 3, 1, 40.0)])[7]
        self.assertEqual(len(horas), 1)
        self.assertAlmostEqual(horas[0].rtt_ms, (10 * 3 + 40 * 1) / 4)
        self.assertAlmostEqual(horas[0].perda_pct, 100 * 2 / 6)
        self.assertEqual(horas[0].pacotes, 6)
        self.assertEqual(horas[0].inicio, datetime(2026, 11, 19, 10, tzinfo=timezone.utc))

    def test_hora_sem_resposta(self):
        t = int(datetime(2026, 11, 19, 10, 0, tzinfo=timezone.utc).timestamp())
        h = c.agrupar_por_hora([ping(7, t, 3, 0)])[7][0]
        self.assertIsNone(h.rtt_ms)
        self.assertEqual(h.perda_pct, 100.0)

    def test_sem_avg_usa_os_rtts_da_lista(self):
        r = ping(7, 1000, 3, 3, 10.0, rtts=[10, 20, 30])
        r["avg"] = -1
        self.assertEqual(c.rtt_do_resultado(r), 20.0)

    def test_ignora_resultados_invalidos(self):
        lixo = [{}, {"prb_id": 1}, {"prb_id": 1, "timestamp": 5, "sent": 0, "rcvd": 0}, {"prb_id": 1, "timestamp": 5, "sent": 3},
                {"prb_id": 1, "timestamp": "x", "sent": 3, "rcvd": 3}]
        self.assertEqual(c.agrupar_por_hora(lixo), {})

    def test_rcvd_com_duplicatas_nao_vira_perda_negativa(self):
        h = c.agrupar_por_hora([ping(7, 3600, 3, 5, 10.0)])[7][0]
        self.assertEqual(h.perda_pct, 0.0)


def historico_dias(dias=7, base=30.0):
    return c.agrupar_por_hora(serie(1, dias, base))[1]


class Modelos(unittest.TestCase):
    def setUp(self):
        self.hist = historico_dias()
        self.alvos = [c.proxima_hora(AGORA) + timedelta(hours=i) for i in range(24)]

    def test_todos_devolvem_um_valor_por_hora_dentro_dos_limites(self):
        for mid, *_resto, funcao in c.MODELOS:
            previsoes = funcao(self.hist, self.alvos)
            self.assertEqual(len(previsoes), 24, mid)
            for rtt, perda in previsoes:
                self.assertGreater(rtt, 0)
                self.assertTrue(0 <= perda <= 100)

    def test_persistencia_repete_a_ultima_hora(self):
        previsoes = c.modelo_persistencia(self.hist, self.alvos)
        self.assertEqual(len(set(previsoes)), 1)
        self.assertAlmostEqual(previsoes[0][0], self.hist[-1].rtt_ms, places=1)

    def test_perfil_horario_enxerga_o_pico_da_noite(self):
        previsoes = dict(zip((a.hour for a in self.alvos), c.modelo_perfil_horario(self.hist, self.alvos)))
        self.assertAlmostEqual(previsoes[23][0], 70.0, places=1)
        self.assertAlmostEqual(previsoes[10][0], 30.0, places=1)
        self.assertGreater(previsoes[23][1], 5.0)  # a perda só ocorre às 23h
        self.assertEqual(previsoes[10][1], 0.0)

    def test_media_24h_fica_entre_o_minimo_e_o_maximo(self):
        rtt, _ = c.modelo_media_24h(self.hist, self.alvos)[0]
        self.assertTrue(30.0 < rtt < 70.0)

    def test_ajustado_sobe_quando_as_ultimas_horas_pioram(self):
        piorado = list(self.hist)
        ultimo = piorado[-1].inicio
        for i in range(6):  # últimas 6 horas com o dobro da latência
            h = piorado[-1 - i]
            piorado[-1 - i] = c.Hora(h.inicio, (h.rtt_ms or 0) * 2, h.perda_pct, h.pacotes)
        normal = c.modelo_perfil_ajustado(self.hist, self.alvos)[0][0]
        ajustado = c.modelo_perfil_ajustado(piorado, self.alvos)[0][0]
        self.assertGreater(ajustado, normal * 1.3)
        self.assertLessEqual(ajustado, normal * 2.0 + 0.1)  # fator limitado a 2x
        self.assertEqual(ultimo, piorado[-1].inicio)

    def test_poucas_horas_usam_media_geral(self):
        curto = self.hist[:5]
        previsoes = c.modelo_perfil_horario(curto, self.alvos)
        self.assertEqual(len(previsoes), 24)

    def test_historico_so_com_perda_total_nao_quebra(self):
        so_perda = [c.Hora(h.inicio, None, 100.0, 3) for h in self.hist[:10]]
        for _mid, *_resto, funcao in c.MODELOS:
            self.assertEqual(len(funcao(so_perda, self.alvos)), 24)


class Saida(unittest.TestCase):
    def executar(self, probes, resultados, **extra):
        pasta = tempfile.mkdtemp()
        args = c.argumentos(["--saida", pasta, "--probes", "3", *[str(x) for kv in extra.items() for x in kv]])
        falso = AtlasFalso(probes, resultados)
        with mock.patch("builtins.print"):
            caminhos = c.executar(args, baixar=falso, agora=AGORA)
        return caminhos, falso

    def dados(self):
        probes = [probe_json(11, -23.6, -46.7), probe_json(12, -23.5, -46.5), probe_json(13, -22.9, -43.2),
                  probe_json(14, -30.0, -51.2), probe_json(15, -8.0, -35.0, status=2)]
        resultados = serie(11) + serie(12, base=80.0) + serie(13, base=15.0) + serie(14, dias=1)
        return probes, resultados

    def test_fim_a_fim(self):
        probes, resultados = self.dados()
        caminhos, falso = self.executar(probes, resultados, **{"--horas-a-frente": 24})
        with caminhos["csv"].open(encoding="utf-8") as f:
            linhas = list(csv.DictReader(f))
        self.assertEqual(len(linhas), 3 * 4 * 24)
        # --probes 3: ficam as 3 mais próximas com dados (a 14 é a mais distante; a 15 está offline)
        self.assertEqual({l["probe_id"] for l in linhas}, {"11", "12", "13"})
        primeiro = min(l["prediction_for"] for l in linhas)
        self.assertEqual(primeiro, "2026-11-19T13:00:00Z")  # próxima hora cheia depois de 12:34:56
        self.assertTrue(all(l["prediction_generated_at"] == "2026-11-19T12:34:56Z" for l in linhas))
        self.assertTrue(all(l["measurement_id"] == "1001" and l["country_code"] == "BR" for l in linhas))
        self.assertEqual(c.validar(caminhos["csv"], caminhos["modelos"]), [])
        modelos = json.loads(caminhos["modelos"].read_text(encoding="utf-8"))
        self.assertEqual([m["id"] for m in modelos], [m[0] for m in c.MODELOS])
        self.assertTrue(all(m["active"] for m in modelos))
        # a probe mais lenta (12) tem latência prevista maior que a mais rápida (13)
        def media(pid):
            v = [float(l["predicted_avg_rtt_ms"]) for l in linhas if l["probe_id"] == pid]
            return sum(v) / len(v)
        self.assertGreater(media("12"), media("13"))
        # nenhum endereço IP vaza para os arquivos
        for caminho in caminhos.values():
            texto = caminho.read_text(encoding="utf-8")
            self.assertNotIn("10.0.0.1", texto)
            self.assertNotIn("200.1.1.1", texto)
        # as requisições foram em lotes e pediram só as probes candidatas
        self.assertTrue(any("/measurements/1001/results/" in u for u in falso.urls))

    def test_cabecalho_igual_ao_do_csv_da_api(self):
        probes, resultados = self.dados()
        caminhos, _ = self.executar(probes, resultados)
        cabecalho = caminhos["csv"].read_text(encoding="utf-8").splitlines()[0]
        self.assertEqual(cabecalho, "prediction_id,model_id,model_version,probe_id,measurement_id,country_code,asn_v4,asn_v6,"
                                    "latitude,longitude,prediction_generated_at,prediction_for,predicted_avg_rtt_ms,"
                                    "predicted_packet_loss_pct,model_confidence")

    def test_sem_dados_suficientes_da_erro_claro(self):
        probes = [probe_json(11, -23.6, -46.7)]
        with self.assertRaises(c.ErroColeta) as ctx:
            self.executar(probes, [])
        self.assertIn("pelo menos", str(ctx.exception))

    def test_sem_probes_da_erro_claro(self):
        with self.assertRaises(c.ErroColeta):
            self.executar([probe_json(1, 0, 0, status=2)], [])

    def test_resposta_fora_do_formato(self):
        with self.assertRaises(c.ErroColeta):
            c.baixar_resultados(1001, [1], 0, 10, baixar=lambda url: {"detail": "x"})


class Validacao(unittest.TestCase):
    def gerar(self):
        probes = [probe_json(11, -23.6, -46.7)]
        pasta = Path(tempfile.mkdtemp())
        args = c.argumentos(["--saida", str(pasta), "--probes", "1"])
        with mock.patch("builtins.print"):
            return pasta, c.executar(args, baixar=AtlasFalso(probes, serie(11)), agora=AGORA)

    def test_detecta_problemas(self):
        pasta, caminhos = self.gerar()
        texto = caminhos["csv"].read_text(encoding="utf-8")
        lixo = pasta / "ruim.csv"
        lixo.write_text(texto.replace(",ripe-media-24h,", ",modelo-fantasma,", 1), encoding="utf-8")
        self.assertTrue(any("modelo-fantasma" in p for p in c.validar(lixo, caminhos["modelos"])))
        proibida = pasta / "ip.csv"
        proibida.write_text(texto.replace("prediction_id,", "prediction_id,src_addr,", 1), encoding="utf-8")
        self.assertIn("proibidas", c.validar(proibida, caminhos["modelos"])[0])
        negativo = pasta / "neg.csv"
        linhas = texto.splitlines()
        partes = linhas[1].split(",")
        partes[12] = "-5"
        linhas[1] = ",".join(partes)
        negativo.write_text("\n".join(linhas) + "\n", encoding="utf-8")
        self.assertTrue(any("negativ" in p for p in c.validar(negativo, caminhos["modelos"])))

    def test_modelos_sem_horario_em_comum(self):
        pasta, caminhos = self.gerar()
        linhas = caminhos["csv"].read_text(encoding="utf-8").splitlines()
        # a persistência fica só com um horário que os outros modelos não têm: sem interseção
        arquivo = pasta / "sem_comum.csv"
        so_depois = [l for l in linhas[1:] if not l.split(",")[1] == "ripe-persistencia"]
        extra = linhas[1].replace("2026-11-19T13:00:00Z", "2030-01-01T00:00:00Z")
        arquivo.write_text("\n".join([linhas[0], *so_depois, extra]) + "\n", encoding="utf-8")
        self.assertTrue(any("em comum" in p for p in c.validar(arquivo, caminhos["modelos"])))


class InstalarNaApi(unittest.TestCase):
    def test_copia_e_guarda_o_original_uma_vez(self):
        probes = [probe_json(11, -23.6, -46.7)]
        api = Path(tempfile.mkdtemp())
        (api / "data").mkdir()
        (api / "pom.xml").write_text("<project/>")
        (api / "data" / "predictions.csv").write_text("DEMO")
        (api / "data" / "models.json").write_text("[]")
        for _ in range(2):  # rodar duas vezes não pode sobrescrever o backup com dados já gerados
            args = c.argumentos(["--saida", tempfile.mkdtemp(), "--probes", "1", "--api", str(api)])
            with mock.patch("builtins.print"):
                c.executar(args, baixar=AtlasFalso(probes, serie(11)), agora=AGORA)
        self.assertEqual((api / "data" / "predictions.csv.demo.bak").read_text(), "DEMO")
        self.assertEqual((api / "data" / "models.json.demo.bak").read_text(), "[]")
        self.assertTrue((api / "data" / "predictions.csv").read_text().startswith("prediction_id,model_id"))
        self.assertEqual(c.validar(api / "data" / "predictions.csv", api / "data" / "models.json"), [])

    def test_pasta_errada(self):
        with self.assertRaises(c.ErroColeta):
            c.instalar_na_api(Path(tempfile.mkdtemp()), {})


class Rede(unittest.TestCase):
    def test_403_nao_insiste(self):
        erro = urllib.error.HTTPError("u", 403, "Forbidden", {}, io.BytesIO(b""))
        with mock.patch("urllib.request.urlopen", side_effect=erro) as aberto, mock.patch("time.sleep") as dormir:
            with self.assertRaises(c.ErroColeta):
                c.baixar_json("https://exemplo")
        self.assertEqual(aberto.call_count, 1)
        dormir.assert_not_called()

    def test_falha_temporaria_tenta_de_novo(self):
        resposta = mock.MagicMock()
        resposta.__enter__.return_value.read.return_value = b'{"ok": true}'
        with mock.patch("urllib.request.urlopen", side_effect=[urllib.error.URLError("x"), resposta]), mock.patch("time.sleep"):
            self.assertEqual(c.baixar_json("https://exemplo"), {"ok": True})

    def test_argumentos_invalidos(self):
        for ruim in (["--centro", "abc"], ["--dias", "0"], ["--dias", "99"], ["--horas-a-frente", "101"]):
            with self.assertRaises(SystemExit), mock.patch("sys.stderr"):
                c.argumentos(ruim)


if __name__ == "__main__":
    unittest.main()
