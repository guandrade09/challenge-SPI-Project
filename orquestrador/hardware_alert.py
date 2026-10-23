"""
Integração com o sinaleiro físico (ESP32: LEDs vermelho/laranja/amarelo/verde + buzzer).

A tomada que corta a energia NÃO é mais controlada daqui. O próprio ESP32 do
sinaleiro avisa um ESP32-C6 via ESP-NOW, e o C6 liga/desliga uma tomada Zigbee
(ver esp32__script/esp32_alert_v4 e esp32__script/TomadaZigbee na Fase 03).
Isso tirou a latência da tomada Tuya Wi-Fi (tinytuya), que era chamada daqui.

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
import os
import threading
import time

import requests

# ── Mesmo hardware da Fase 03 — atualizar aqui se o IP mudar ────────────────
ESP_IP         = os.getenv("ESP_IP", "10.198.250.62")  # sobrescreva com a env ESP_IP ao trocar de wifi

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
