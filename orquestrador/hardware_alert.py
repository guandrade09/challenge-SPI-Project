"""
Integração com o sinaleiro físico (ESP32: LEDs vermelho/laranja/amarelo/verde + buzzer).

A tomada que corta a energia NÃO é mais controlada daqui: o firmware do
sinaleiro cuida dela via Zigbee. Isso tirou a latência da tomada Tuya Wi-Fi
(tinytuya), que era chamada daqui. Montagens suportadas (firmwares em firmware/):
  - SÓ A TOMADA pelo cabo USB (quando ESP_SERIAL está definida, ex.
    ESP_SERIAL=COM5): ESP32-C6 coordenador Zigbee (tomada_usb_c6), sem LEDs.
    Os estados abaixo viram "tomada off" (vermelho/laranja) e "tomada on"
    (verde); amarelo não manda nada. Não depende de Wi-Fi.
  - placa única pelo Wi-Fi: o mesmo sinaleiro_c6 com USAR_WIFI = true (ESP_IP).
  - duas placas pelo Wi-Fi: ESP32 do sinaleiro avisa um ESP32-C6 via ESP-NOW
    (duas_placas/esp32_alert_v3 + duas_placas/TomadaZigbee) (ESP_IP).

Portado da Fase 03 (ver Fase 03/main.py e Fase 03/esp32-leds.md), adaptado pro
orquestrador multi-setor atual — lá era um único setor/câmera com uma causa de
risco só (EPI); aqui existem três causas independentes (EPI, queda, invasão de
zona) já debounced pelo orquestrador, e cada setor roda seu próprio pipeline.

Regras (definidas com a usuária):
  - 4 estados no sinaleiro: vermelho (queda/zona — risco grave), laranja (EPI
    ausente — risco leve), amarelo (neutro/automático no firmware) e verde
    (tudo certo). Vermelho tem prioridade sobre laranja se os dois ocorrerem
    juntos (ver _run_sector: `grave_alert` cobre queda OU zona).
  - O buzzer soa em vermelho E em laranja (mesmo pino, ver esp32_alert_v4.ino)
    — só não soa em amarelo/verde.
  - A tomada segue o LED aceso (regra no firmware do ESP32): vermelho ou
    laranja desligam; verde liga de novo; amarelo mantém como estava.
  - O verde só é enviado depois de "tudo limpo" por CLEAR_FRAMES_TO_GREEN
    frames seguidos (mesmo critério de histerese da Fase 03), então a tomada
    nunca volta a ligar ao sair do vermelho direto pro amarelo.
  - Como o orquestrador agora pode ter vários setores ativos ao mesmo tempo
    mas o hardware é um só, o estado agregado é: OR entre setores pra alerta
    (qualquer setor em risco já é vermelho) e AND entre setores pra "tudo
    limpo" (todos os setores com gente têm que estar limpos pra ir pro verde).
"""
import json
import os
import threading
import time

import requests

# ── Conexão com o sinaleiro ──────────────────────────────────────────────────
# ESP_SERIAL definida (ex.: "COM5") -> fala com o ESP32-C6 pelo cabo USB.
# Sem ESP_SERIAL -> fala por HTTP no ESP_IP (sobrescreva com a env ao trocar de wifi).
ESP_SERIAL     = os.getenv("ESP_SERIAL") or None
ESP_BAUD       = int(os.getenv("ESP_BAUD", "115200"))
ESP_IP         = os.getenv("ESP_IP", "10.198.250.62")

# Bem menor que o TIMEOUT_MS (5s) do watchdog do ESP32 — ver esp32_alert_v4.ino
LED_REFRESH_INTERVAL  = 2.0
# Frames seguidos "tudo certo" pra confirmar verde (mesmo valor da Fase 03)
CLEAR_FRAMES_TO_GREEN = 15


# ── ESP32 (HTTP) ─────────────────────────────────────────────────────────────
# Cada notify_esp_* é chamado a partir de uma thread nova (ver report_sector) e,
# sem essa trava, um ESP32 fora do ar empilha uma thread bloqueada (timeout=2s)
# por chamada — com 4 setores ativos chamando report_sector a cada frame, isso
# já chegou a empilhar ~300 threads numa sessão e derrubou a leitura de TODAS
# as câmeras (inclusive a webcam local, sem nenhuma dependência de rede) por
# pressão de CPU/memória.
_esp_busy = threading.Event()


# ── ESP32 (cabo USB) ─────────────────────────────────────────────────────────
# Protocolo de linhas do tomada_usb_c6.ino: envia "tomada on|off" / "status" e
# espera uma resposta que começa com "@" ("@ok", "@erro ...", "@status {json}").
# As outras linhas que o C6 imprime (logs) são ignoradas.
_serial_lock = threading.Lock()
_serial_port = None


def _serial_abrir():
    global _serial_port
    if _serial_port is None:
        import serial  # pyserial — só necessário no modo USB

        s = serial.Serial()
        s.port = ESP_SERIAL
        s.baudrate = ESP_BAUD
        s.timeout = 0.1
        s.write_timeout = 1
        s.dtr = False  # DTR/RTS desligados: abrir a porta não reinicia a placa
        s.rts = False
        s.open()
        _serial_port = s
    return _serial_port


def _serial_fechar() -> None:
    global _serial_port
    if _serial_port is not None:
        try:
            _serial_port.close()
        except Exception:
            pass
        _serial_port = None


def _serial_comando(linha: str, timeout: float = 1.5) -> "str | None":
    """Envia uma linha pro C6 e devolve a resposta "@..." (ou None se não veio).
    Levanta exceção se a porta não abrir — quem chama trata."""
    with _serial_lock:
        try:
            s = _serial_abrir()
            s.reset_input_buffer()
            s.write((linha + "\n").encode())
            fim = time.time() + timeout
            buf = b""
            while time.time() < fim:
                buf += s.read(256)
                while b"\n" in buf:
                    bruto, buf = buf.split(b"\n", 1)
                    resposta = bruto.decode(errors="replace").strip()
                    if resposta.startswith("@"):
                        return resposta
            return None
        except Exception:
            _serial_fechar()  # tenta reabrir na próxima chamada (cabo pode ter sido religado)
            raise


def _comando_tomada(led: str, state: str) -> "str | None":
    """Modo USB (só tomada): traduz o estado do sinaleiro num comando pra tomada.
    Vermelho (queda/zona) ou laranja (EPI ausente) desligam; verde liga;
    apagar LEDs (volta pro amarelo) não muda a tomada."""
    if state != "on":
        return None
    if led in ("vermelho", "laranja"):
        return "tomada off"
    if led == "verde":
        return "tomada on"
    return None


# Modo USB: uma thread só envia pra tomada, sempre o pedido MAIS RECENTE.
# Antes, um pedido que chegava enquanto outro ainda era enviado (ex.: o "verde"
# repetido a cada 2 s) era descartado — e se fosse o "tomada off" de uma queda,
# a tomada só desligava no próximo reenvio, até ~2 s depois do popup.
# Agora nada é descartado: o pedido novo substitui o antigo e sai assim que o
# envio em andamento (~100 ms) termina. O estado também é reenviado a cada
# TOMADA_REENVIO_S, pra tomada se acertar se o C6 reiniciar ou o cabo voltar.
TOMADA_REENVIO_S = 2.0
_tomada_lock      = threading.Lock()
_tomada_evento    = threading.Event()
_tomada_desejada: "tuple[str, str, float] | None" = None   # (comando, motivo, quando pediu)
_tomada_worker_ok = False


def _pedir_tomada(comando: str, motivo: str) -> None:
    global _tomada_desejada, _tomada_worker_ok
    with _tomada_lock:
        _tomada_desejada = (comando, motivo, time.perf_counter())
        if not _tomada_worker_ok:
            _tomada_worker_ok = True
            threading.Thread(target=_tomada_worker, daemon=True, name="tomada-usb").start()
    _tomada_evento.set()


def _tomada_worker() -> None:
    ultimo_ok = None     # último comando confirmado pelo C6
    ultimo_erro = None   # evita repetir a mesma mensagem de erro a cada 2 s
    while True:
        _tomada_evento.wait(timeout=TOMADA_REENVIO_S)
        _tomada_evento.clear()
        with _tomada_lock:
            pedido = _tomada_desejada
        if pedido is None:
            continue
        comando, motivo, pedido_em = pedido
        try:
            resposta = _serial_comando(comando)
        except Exception as e:
            erro = str(e)
            if erro != ultimo_erro:
                print(f"[TOMADA] falha ao enviar '{comando}': {erro}")
                ultimo_erro = erro
            ultimo_ok = None
            continue
        if resposta == "@ok":
            if comando != ultimo_ok or ultimo_erro:
                atraso_ms = (time.perf_counter() - pedido_em) * 1000
                print(f"[TOMADA] {comando} ({motivo}): ok em {atraso_ms:.0f} ms")
            ultimo_ok, ultimo_erro = comando, None
        else:
            print(f"[TOMADA] {comando} ({motivo}): {resposta or 'sem resposta do C6'}")
            ultimo_ok = None


def notify_esp_led(led: str, state: str) -> None:
    if ESP_SERIAL:
        comando = _comando_tomada(led, state)
        if comando is not None:
            _pedir_tomada(comando, led)
        return  # amarelo / apagar LEDs: nada a fazer na tomada
    if _esp_busy.is_set():
        print(f"[ESP32] aviso ({led} {state}) ignorado — chamada anterior ainda em andamento")
        return
    _esp_busy.set()
    try:
        r = requests.post(f"http://{ESP_IP}/led", json={"led": led, "state": state}, timeout=2)
        print(f"[ESP32] {led} -> {state}: {r.status_code}")
    except Exception as e:
        print(f"[ESP32] falha ao avisar ({led} {state}): {e}")
    finally:
        _esp_busy.clear()


def notify_esp_alert():
    """Acende vermelho — risco grave (queda/zona). O firmware desliga a tomada."""
    notify_esp_led("vermelho", "on")


def notify_esp_orange():
    """Acende laranja — EPI ausente. O firmware desliga a tomada."""
    notify_esp_led("laranja", "on")


def notify_esp_clear():
    """Acende verde (o ESP32 apaga vermelho/laranja sozinho e religa a tomada)."""
    notify_esp_led("verde", "on")


def notify_esp_analyzing():
    """Apaga vermelho, laranja e verde -> o amarelo acende sozinho no firmware."""
    notify_esp_led("vermelho", "off")
    notify_esp_led("laranja", "off")
    notify_esp_led("verde", "off")


# ── Verificação do hardware (sinaleiro + tomada) ─────────────────────────────
# Pelo cabo: comando "status". Pelo Wi-Fi: GET /status. Na montagem de duas
# placas, o sinaleiro sabe se o C6 está conectado porque o C6 responde via
# ESP-NOW a cada 2 s. Verificado ao iniciar o orquestrador e depois a cada
# HARDWARE_CHECK_INTERVAL segundos (só loga quando algo muda).
HARDWARE_CHECK_INTERVAL = 30.0


def _onde() -> str:
    return f"USB {ESP_SERIAL}" if ESP_SERIAL else ESP_IP


def consultar_status_hardware() -> "dict | None":
    """Pergunta o estado ao sinaleiro. None se ele não respondeu."""
    if ESP_SERIAL:
        try:
            resposta = _serial_comando("status", timeout=2.5)
        except Exception:
            return None
        if not resposta or not resposta.startswith("@status "):
            return None
        try:
            return json.loads(resposta[len("@status "):])
        except ValueError:
            return {"status": "sem_status"}
    try:
        r = requests.get(f"http://{ESP_IP}/status", timeout=3)
    except requests.exceptions.RequestException:
        return None
    if r.status_code != 200:
        return {"status": "sem_status"}
    try:
        return r.json()
    except ValueError:
        return {"status": "sem_status"}


def _resumo_hardware(st: "dict | None") -> list[str]:
    if st is None:
        if ESP_SERIAL:
            return [f"⚠ ESP32-C6 não respondeu na porta {ESP_SERIAL} — confira o cabo USB, o "
                    "ESP_SERIAL e se o Monitor Serial da Arduino IDE está fechado"]
        return [f"⚠ Sinaleiro ESP32 não respondeu em http://{ESP_IP} — confira se está ligado e o ESP_IP"]
    if st.get("status") != "ok":
        return [f"Sinaleiro ESP32 online em {ESP_IP}, mas com firmware antigo (sem /status) — "
                "grave o esp32_alert_v3.ino atualizado pra verificar a tomada"]

    canal = st.get("canal")

    # Placa única (ESP32-C6 com LEDs + Zigbee): não há ESP-NOW nem segunda placa
    if st.get("placa") == "c6":
        if st.get("modo") == "tomada":
            linhas = [f"ESP32-C6 da tomada conectado via {_onde()}"]
        elif ESP_SERIAL:
            linhas = [f"Sinaleiro ESP32-C6 conectado via {_onde()} (LED atual: {st.get('led')})"]
        else:
            linhas = [f"Sinaleiro ESP32-C6 online em {ESP_IP} (Wi-Fi no canal {canal}, sinal {st.get('rssi')} dBm)"]
        if st.get("tomada_pareada"):
            linhas.append("Tomada Zigbee pareada ✓")
        else:
            linhas.append("⚠ Tomada Zigbee NÃO está pareada com o C6 — segure o BOOT do C6 3 s e "
                          "o botão da tomada 5 s para parear")
        return linhas

    # Montagem com duas placas (ESP32 sinaleiro + ESP32-C6 via ESP-NOW)
    linhas = [f"Sinaleiro ESP32 online em {ESP_IP} (Wi-Fi no canal {canal})"]
    if not st.get("espnow"):
        linhas.append("⚠ ESP-NOW não iniciou no sinaleiro — a tomada não será controlada")
    elif not st.get("c6_online"):
        linhas.append(f"⚠ ESP32-C6 da tomada NÃO conectado — confira se ele está ligado e "
                      f"se mostra 'ESP-NOW pronto no canal {canal}' no Monitor Serial")
    elif not st.get("c6_recebe_comandos"):
        linhas.append("⚠ ESP32-C6 responde, mas não está confirmando os comandos do sinaleiro")
    elif not st.get("tomada_pareada"):
        linhas.append("⚠ ESP32-C6 conectado, mas a tomada NÃO está pareada com ele")
    else:
        linhas.append("ESP32-C6 da tomada conectado e tomada pareada ✓")
    return linhas


def _verificar_e_logar() -> list[str]:
    st = consultar_status_hardware()
    linhas = _resumo_hardware(st)
    for linha in linhas:
        print(f"[HARDWARE] {linha}")
    if st and (st.get("c6_online") or st.get("placa") == "c6"):
        print(f"[HARDWARE] Tomada: {st.get('tomada', 'indefinida')}")
    return linhas


def verificar_hardware() -> bool:
    """Consulta o sinaleiro e mostra no log. Retorna True se sinaleiro, C6 e tomada estão OK."""
    linhas = _verificar_e_logar()
    return not any(l.startswith("⚠") for l in linhas) and "firmware antigo" not in linhas[0]


def _monitor_hardware_worker(anteriores: list[str]) -> None:
    while True:
        time.sleep(HARDWARE_CHECK_INTERVAL)
        linhas = _resumo_hardware(consultar_status_hardware())
        if linhas != anteriores:
            for linha in linhas:
                print(f"[HARDWARE] {linha}")
            anteriores = linhas


def iniciar_monitor_hardware() -> None:
    """Chamar uma vez ao subir o orquestrador: verifica agora e segue monitorando."""
    print("[HARDWARE] Verificando sinaleiro e tomada...")
    anteriores = _verificar_e_logar()
    threading.Thread(
        target=_monitor_hardware_worker, args=(anteriores,), daemon=True, name="hardware-monitor"
    ).start()


# ── Máquina de estados agregada (todos os setores ativos compartilham o mesmo
#    sinaleiro físico) ───────────────────────────────────────────────────────
_lock          = threading.Lock()
_state         = "yellow"   # "red" | "orange" | "yellow" | "green" — espelha o LED aceso no ESP32
_last_refresh  = 0.0
_clear_streak  = 0
_sector_flags: dict[str, dict] = {}


def report_sector(setor: str, epi_alert: bool, grave_alert: bool, pessoa_presente: bool) -> None:
    """Chamar uma vez por frame processado em cada setor ativo (_run_sector).

    epi_alert       — EPI ausente confirmado (laranja)
    grave_alert     — queda OU invasão de zona confirmada (vermelho)
    pessoa_presente — alguém detectado no frame desse setor (sem isso o setor
                       nunca "confirma" o verde, só não bloqueia os outros)
    """
    global _state, _last_refresh, _clear_streak

    with _lock:
        _sector_flags[setor] = {"epi": epi_alert, "grave": grave_alert, "pessoa": pessoa_presente}

        algum_grave = any(f["grave"] for f in _sector_flags.values())
        algum_epi   = any(f["epi"] for f in _sector_flags.values())
        setores_com_pessoa = [f for f in _sector_flags.values() if f["pessoa"]]
        tudo_limpo = (
            not algum_grave and not algum_epi
            and bool(setores_com_pessoa)
            and all(not f["epi"] and not f["grave"] for f in setores_com_pessoa)
        )

        now = time.time()

        # Vermelho (grave) tem prioridade sobre laranja (EPI) se os dois ocorrerem juntos.
        if algum_grave:
            _clear_streak = 0
            if _state != "red":
                threading.Thread(target=notify_esp_alert, daemon=True).start()
                _state = "red"
                _last_refresh = now
        elif algum_epi:
            _clear_streak = 0
            if _state != "orange":
                threading.Thread(target=notify_esp_orange, daemon=True).start()
                _state = "orange"
                _last_refresh = now
        else:
            _clear_streak = _clear_streak + 1 if tudo_limpo else 0

            if _state in ("red", "orange"):
                threading.Thread(target=notify_esp_analyzing, daemon=True).start()
                _state = "yellow"
                _last_refresh = now

            if _clear_streak >= CLEAR_FRAMES_TO_GREEN and _state != "green":
                threading.Thread(target=notify_esp_clear, daemon=True).start()
                _state = "green"
                _last_refresh = now

        # Heartbeat contra o watchdog de 5s do ESP32
        if now - _last_refresh >= LED_REFRESH_INTERVAL:
            if _state == "red":
                threading.Thread(target=notify_esp_alert, daemon=True).start()
            elif _state == "orange":
                threading.Thread(target=notify_esp_orange, daemon=True).start()
            elif _state == "green":
                threading.Thread(target=notify_esp_clear, daemon=True).start()
            _last_refresh = now


def remover_setor(setor: str) -> None:
    """Chamar quando o pipeline de um setor encerra, pra não deixar flag velha
    bloqueando o verde pra sempre (ver _run_sector, bloco finally)."""
    with _lock:
        _sector_flags.pop(setor, None)
