"""
Integração com o sinaleiro físico (ESP32: LEDs vermelho/amarelo/verde + buzzer)
e a tomada Tuya que corta energia em risco grave.

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
  - Só queda OU invasão de zona desligam a tomada Tuya (risco físico imediato
    a uma pessoa). EPI ausente sozinho NÃO desliga a tomada — só alerta.
  - A tomada só volta a ligar quando o sistema confirmar "tudo limpo" por
    CLEAR_FRAMES_TO_GREEN frames seguidos (mesmo critério de histerese da
    Fase 03) — nunca ao sair do vermelho direto pro amarelo.
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
import tinytuya

# ── Mesmo hardware da Fase 03 — atualizar aqui se IP/credenciais mudarem ────
ESP_IP         = os.getenv("ESP_IP", "10.198.250.62")  # sobrescreva com a env ESP_IP ao trocar de wifi

# Tomadas Tuya — as credenciais (device_id/local_key) NÃO ficam no código: quem
# tem a local_key controla a tomada pela rede. Elas ficam em
# orquestrador/tuya_plugs.json (ignorado pelo git); copie tuya_plugs.example.json
# e preencha. Pra usar outra tomada, troque PLUG_ATIVA (ou defina a variável de
# ambiente PLUG_ATIVA antes de subir o orquestrador). O IP muda a cada wifi
# (descubra com `python -m tinytuya scan`) — sobrescreva com a env PLUG_IP.
PLUGS_FILE = os.getenv(
    "TUYA_PLUGS_FILE",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "tuya_plugs.json"),
)


def _load_plugs() -> dict:
    try:
        with open(PLUGS_FILE, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"[TUYA] {PLUGS_FILE} não encontrado — tomada desativada (só o sinaleiro funciona).")
    except (OSError, ValueError) as e:
        print(f"[TUYA] falha ao ler {PLUGS_FILE}: {e} — tomada desativada.")
    return {}


PLUGS = _load_plugs()
PLUG_ATIVA = os.getenv("PLUG_ATIVA", "teste")
if PLUGS and PLUG_ATIVA not in PLUGS:
    raise ValueError(f"PLUG_ATIVA='{PLUG_ATIVA}' inválida — opções: {', '.join(PLUGS)}")
if PLUG_ATIVA in PLUGS:
    _ip_env = os.getenv("PLUG_IP") or (os.getenv("PLUG_TESTE_IP") if PLUG_ATIVA == "teste" else None)
    if _ip_env:
        PLUGS[PLUG_ATIVA]["ip"] = _ip_env

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
# pressão de CPU/memória. Mesmo padrão de trava que _plug_busy já usa pra Tuya.
_esp_busy = threading.Event()


def notify_esp_led(led: str, state: str) -> None:
    if _esp_busy.is_set():
        print(f"[ESP32] aviso ({led} {state}) ignorado — chamada anterior ainda em andamento")
        return
    _esp_busy.set()
    try:
        r = requests.post(f"http://{ESP_IP}/led", json={"led": led, "state": state}, timeout=2)
        print(f"[ESP32] {led} -> {state}: {r.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[ESP32] falha ao avisar ({led} {state}): {e}")
    finally:
        _esp_busy.clear()


def notify_esp_alert():
    """Acende vermelho — risco grave (queda/zona). Mutuamente exclusivo com laranja/verde no firmware."""
    notify_esp_led("vermelho", "on")


def notify_esp_orange():
    """Acende laranja — EPI ausente (risco leve, não desliga a tomada)."""
    notify_esp_led("laranja", "on")


def notify_esp_clear():
    """Acende verde (o ESP32 apaga vermelho/laranja sozinho)."""
    notify_esp_led("verde", "on")


def notify_esp_analyzing():
    """Apaga vermelho, laranja e verde -> o amarelo acende sozinho no firmware."""
    notify_esp_led("vermelho", "off")
    notify_esp_led("laranja", "off")
    notify_esp_led("verde", "off")


# ── Tomada Tuya ──────────────────────────────────────────────────────────────
_plug_lock = threading.Lock()
_plug_busy = False


def _send_plug_command(label: str, turn_on: bool) -> None:
    global _plug_busy
    with _plug_lock:
        if _plug_busy:
            print(f"[TUYA] comando '{label}' ignorado (já tem outro em andamento)")
            return
        _plug_busy = True
    try:
        plug = PLUGS.get(PLUG_ATIVA)
        if plug is None:
            return  # sem tuya_plugs.json: só o sinaleiro funciona
        device = tinytuya.OutletDevice(plug["device_id"], plug["ip"], plug["local_key"], version=plug["version"])
        device.set_socketTimeout(3)
        result = device.turn_on() if turn_on else device.turn_off()
        if isinstance(result, dict) and result.get("Error"):
            print(f"[TUYA:{PLUG_ATIVA}] falha ao {label}: {result}")
        else:
            print(f"[TUYA:{PLUG_ATIVA}] {label}: ok ({result})")
    except Exception as e:
        print(f"[TUYA:{PLUG_ATIVA}] falha ao {label}: {e}")
    finally:
        with _plug_lock:
            _plug_busy = False


def plug_turn_off():
    _send_plug_command("desligar", turn_on=False)


def plug_turn_on():
    _send_plug_command("ligar", turn_on=True)


# ── Máquina de estados agregada (todos os setores ativos compartilham o mesmo
#    sinaleiro físico) ───────────────────────────────────────────────────────
_lock          = threading.Lock()
_state         = "yellow"   # "red" | "orange" | "yellow" | "green" — espelha o LED aceso no ESP32
_last_refresh  = 0.0
_clear_streak  = 0
_grave_cut     = False      # True enquanto a tomada estiver desligada por queda/zona
_sector_flags: dict[str, dict] = {}


def report_sector(setor: str, epi_alert: bool, grave_alert: bool, pessoa_presente: bool) -> None:
    """Chamar uma vez por frame processado em cada setor ativo (_run_sector).

    epi_alert       — EPI ausente confirmado (não desliga a tomada)
    grave_alert     — queda OU invasão de zona confirmada (desliga a tomada)
    pessoa_presente — alguém detectado no frame desse setor (sem isso o setor
                       nunca "confirma" o verde, só não bloqueia os outros)
    """
    global _state, _last_refresh, _clear_streak, _grave_cut

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

        # Corta a tomada na borda de subida do risco grave (só uma vez, não a cada frame)
        if algum_grave and not _grave_cut:
            threading.Thread(target=plug_turn_off, daemon=True).start()
            _grave_cut = True

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
                if _grave_cut:
                    threading.Thread(target=plug_turn_on, daemon=True).start()
                    _grave_cut = False
                _state = "green"
                _last_refresh = now

        # Heartbeat contra o watchdog de 5s do ESP32 (só o LED, a tomada não tem watchdog)
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
