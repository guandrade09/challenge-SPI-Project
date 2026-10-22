"""
Teste manual do firmware do ESP32 (sinaleiro de LEDs + buzzer), sem depender
do orquestrador. Bate direto no HTTP exposto pelo esp32_alert_v4.ino.

Uso:
    python test_esp32_led.py                  # roda a bateria de testes (pausas p/ observar)
    python test_esp32_led.py --ip 10.0.0.5     # usa outro IP em vez do padrao
    python test_esp32_led.py --watchdog        # inclui o teste de timeout (~6s)
    python test_esp32_led.py --delay 4         # aumenta a pausa entre passos (segundos)
    python test_esp32_led.py --only vermelho   # testa so um LED (liga, espera, desliga)
    python test_esp32_led.py --only laranja --loop   # fica piscando esse LED ate Ctrl+C
                                                       # (bom pra testar com multimetro)

Requisitos: `requests` (ja esta em requirements.txt).
"""
import argparse
import os
import time

import requests

ESP_IP_PADRAO = os.getenv("ESP_IP", "10.14.22.245")  # mesmo padrao/env de hardware_alert.py
DELAY_PADRAO = 2.5  # segundos de pausa entre passos, pra dar tempo de olhar/ouvir o hardware


def post_led(base_url: str, led: str, state: str, timeout: float = 2.0):
    return requests.post(f"{base_url}/led", json={"led": led, "state": state}, timeout=timeout)


def post_led_raw(base_url: str, body, timeout: float = 2.0):
    """Envia um corpo cru (string ou None) pra testar validacao de entrada."""
    headers = {"Content-Type": "application/json"}
    return requests.post(f"{base_url}/led", data=body, headers=headers, timeout=timeout)


def checar(nome: str, condicao: bool, detalhe: str = "") -> bool:
    status = "OK" if condicao else "FALHOU"
    print(f"[{status}] {nome}" + (f" - {detalhe}" if detalhe and not condicao else ""))
    return condicao


def pausa(segundos: float, motivo: str) -> None:
    print(f"    ... aguardando {segundos:.1f}s ({motivo}) ...")
    time.sleep(segundos)


def testar_led_isolado(base_url: str, led: str, delay: float, loop: bool) -> int:
    """Liga/desliga so um LED (e o buzzer, se for vermelho ou laranja), pra
    diagnostico de hardware isolado (multimetro, checar fiacao, etc)."""
    buzzer = " + buzzer" if led in ("vermelho", "laranja") else ""

    try:
        r = requests.get(f"{base_url}/", timeout=2)
        if not checar("GET / responde 200", r.status_code == 200, f"status={r.status_code}"):
            return 1
    except requests.exceptions.RequestException as e:
        checar("GET / responde 200", False, str(e))
        print("\nNao foi possivel conectar ao ESP32. Verifique IP, WiFi e se o sketch esta rodando.")
        return 1

    print(f"\n== Testando somente {led.upper()}{buzzer} em {base_url} ==")
    if loop:
        print("(Ctrl+C para parar)\n")

    falhas = 0
    try:
        while True:
            r_on = post_led(base_url, led, "on")
            falhas += not checar(f"POST /led {led}=on -> 200", r_on.status_code == 200, f"status={r_on.status_code}")
            print(f"    >> {led.upper()} deve estar aceso agora{buzzer}")
            pausa(delay, f"observar {led} aceso")

            r_off = post_led(base_url, led, "off")
            falhas += not checar(f"POST /led {led}=off -> 200", r_off.status_code == 200, f"status={r_off.status_code}")
            print(f"    >> {led.upper()} deve ter apagado agora")
            pausa(delay, f"observar {led} apagado")

            if not loop:
                break
    except KeyboardInterrupt:
        print("\nInterrompido pelo usuario.")
        post_led(base_url, led, "off")

    print(f"\n== Resultado: {'TUDO OK' if falhas == 0 else f'{falhas} teste(s) falharam'} ==")
    return falhas


def rodar_testes(base_url: str, incluir_watchdog: bool, delay: float) -> int:
    falhas = 0

    print(f"\n== Testando ESP32 em {base_url} (pausa de {delay}s entre passos) ==\n")

    # 1) Servidor de pe
    try:
        r = requests.get(f"{base_url}/", timeout=2)
        falhas += not checar("GET / responde 200", r.status_code == 200, f"status={r.status_code}")
    except requests.exceptions.RequestException as e:
        checar("GET / responde 200", False, str(e))
        print("\nNao foi possivel conectar ao ESP32. Verifique IP, WiFi e se o sketch esta rodando.")
        return falhas + 1

    # 2) Cada LED liga corretamente (buzzer deve tocar junto com vermelho e laranja)
    for led in ("vermelho", "laranja", "verde"):
        r = post_led(base_url, led, "on")
        falhas += not checar(f"POST /led {led}=on -> 200", r.status_code == 200, f"status={r.status_code} body={r.text}")
        falhas += not checar(f"POST /led {led}=on -> status ok", r.json().get("status") == "ok", r.text)
        buzzer = " + buzzer" if led in ("vermelho", "laranja") else ""
        print(f"    >> Confira agora: LED {led.upper()} deve estar aceso{buzzer}")
        pausa(delay, f"observar {led}{buzzer}")
        r_off = post_led(base_url, led, "off")
        falhas += not checar(f"POST /led {led}=off -> 200", r_off.status_code == 200, f"status={r_off.status_code}")
        print(f"    >> {led.upper()} deve ter apagado agora (amarelo volta sozinho)")
        pausa(delay, f"observar {led} apagando")

    # 3) Corpo vazio -> 400
    r = post_led_raw(base_url, None)
    falhas += not checar("Corpo vazio -> 400", r.status_code == 400, f"status={r.status_code} body={r.text}")

    # 4) JSON invalido -> 400
    r = post_led_raw(base_url, "{isso nao e json}")
    falhas += not checar("JSON invalido -> 400", r.status_code == 400, f"status={r.status_code} body={r.text}")

    # 5) led invalido -> 400
    r = post_led(base_url, "azul", "on")
    falhas += not checar("led invalido -> 400", r.status_code == 400, f"status={r.status_code} body={r.text}")

    # 6) state invalido -> 400
    r = post_led(base_url, "vermelho", "ligado")
    falhas += not checar("state invalido -> 400", r.status_code == 400, f"status={r.status_code} body={r.text}")

    # 7) Mutua exclusividade: ligar vermelho depois de verde deve ser aceito
    #    (o firmware apaga os outros dois sozinho; so validamos a resposta aqui)
    print("    >> Ligando VERDE...")
    post_led(base_url, "verde", "on")
    pausa(delay, "observar verde aceso")
    print("    >> Ligando VERMELHO (verde deve apagar sozinho)")
    r = post_led(base_url, "vermelho", "on")
    falhas += not checar("vermelho=on apos verde=on -> 200", r.status_code == 200, f"status={r.status_code}")
    pausa(delay, "observar troca verde -> vermelho")
    post_led(base_url, "vermelho", "off")

    # 8) Watchdog (opcional, demora ~6s): liga um LED e espera o timeout de 5s
    if incluir_watchdog:
        print("\nTestando watchdog (aguardando ~6s sem enviar comando novo)...")
        post_led(base_url, "vermelho", "on")
        print("    >> VERMELHO ligado, agora esperando o timeout do firmware...")
        time.sleep(6)
        print("    >> Verifique visualmente: o LED vermelho deve ter apagado e o amarelo acendido sozinho.")

    # Deixa o sistema limpo ao final do teste
    for led in ("vermelho", "laranja", "verde"):
        post_led(base_url, led, "off")

    print(f"\n== Resultado: {'TUDO OK' if falhas == 0 else f'{falhas} teste(s) falharam'} ==")
    return falhas


def main():
    parser = argparse.ArgumentParser(description="Testa o firmware ESP32 (LEDs + buzzer) via HTTP.")
    parser.add_argument("--ip", default=ESP_IP_PADRAO, help=f"IP do ESP32 (padrao: {ESP_IP_PADRAO})")
    parser.add_argument("--watchdog", action="store_true", help="Inclui o teste de timeout de 5s (demora mais)")
    parser.add_argument("--delay", type=float, default=DELAY_PADRAO, help=f"Pausa em segundos entre passos (padrao: {DELAY_PADRAO})")
    parser.add_argument("--only", choices=["vermelho", "laranja", "verde"], help="Testa somente esse LED, isolado dos demais")
    parser.add_argument("--loop", action="store_true", help="Com --only: fica piscando o LED repetidamente ate Ctrl+C")
    args = parser.parse_args()

    base_url = f"http://{args.ip}"

    if args.only:
        falhas = testar_led_isolado(base_url, args.only, args.delay, args.loop)
        raise SystemExit(1 if falhas else 0)

    falhas = rodar_testes(base_url, args.watchdog, args.delay)
    raise SystemExit(1 if falhas else 0)


if __name__ == "__main__":
    main()
