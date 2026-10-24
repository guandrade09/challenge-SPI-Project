# Firmwares dos ESP32

Código das placas que cortam a energia (tomada Zigbee) quando o orquestrador detecta risco.
Quem decide é o orquestrador ([`orquestrador/hardware_alert.py`](../orquestrador/hardware_alert.py)); as placas só obedecem.

| Situação | Tomada |
|---|---|
| EPI ausente, invasão da área de risco ou queda | **Desliga** |
| Todos fora da área e com EPI por 15 frames seguidos | **Liga** |
| Ninguém na câmera / analisando | Não muda |

## Montagem atual: só a tomada, pelo cabo USB

**PC (orquestrador) → cabo USB → ESP32-C6 → Zigbee → tomada**

Pasta: [`tomada_usb_c6`](tomada_usb_c6/). Não usa Wi-Fi nem LEDs.

1. Grave o `tomada_usb_c6.ino` no ESP32-C6 (configuração abaixo).
2. Pareie a tomada uma vez: segure o **BOOT** do C6 por 3 s (ou ele já abre a rede por 3 min ao ligar) e o botão da tomada por ~5 s, até o LED dela piscar rápido.
3. Rode o orquestrador apontando para a porta do C6:
   ```powershell
   $env:ESP_SERIAL = "COM5"   # porta do C6 no Gerenciador de Dispositivos
   python main.py
   ```
   No início do log deve aparecer `[HARDWARE] ESP32-C6 da tomada conectado via USB COM5` e `Tomada Zigbee pareada ✓`.

> Feche o Monitor Serial da Arduino IDE antes de rodar o orquestrador: só um programa por vez usa a porta.

Comandos aceitos pela USB (115200 baud, um por linha): `tomada on`, `tomada off`, `status`, `ping`.
No Monitor Serial também dá para testar à mão: `ligar`, `desligar`, `parear`, `lista`, `info`, `reset`.

## Outras montagens (pelo Wi-Fi)

| Pasta | O que é | Orquestrador |
|---|---|---|
| [`sinaleiro_c6`](sinaleiro_c6/) | Um ESP32-C6 com LEDs (GPIO 18–21), buzzer (GPIO 22) e tomada. Por USB ou, com `USAR_WIFI = true`, por HTTP | `ESP_SERIAL` ou `ESP_IP` |
| [`duas_placas/esp32_alert_v3`](duas_placas/esp32_alert_v3/) + [`duas_placas/TomadaZigbee`](duas_placas/TomadaZigbee/) | ESP32 DevKit V1 com os LEDs (HTTP) avisa um ESP32-C6 via ESP-NOW, e o C6 controla a tomada | `ESP_IP` |

Nessas, troque `SEU_WIFI` / `SUA_SENHA` pelos dados da rede (2,4 GHz) antes de gravar — **não faça commit da senha real**.

Mapa de pinos do ESP32-C6: [`pinos_esp32c6.png`](pinos_esp32c6.png).

## Configuração da Arduino IDE para o ESP32-C6

Pacote **esp32 by Espressif 3.x**.

| Opção (Tools) | Valor |
|---|---|
| Board | ESP32C6 Dev Module |
| Zigbee mode | Zigbee ZCZR (coordinator/router) |
| Partition Scheme | **Custom** (usa o `partitions.csv` da pasta) |
| USB CDC On Boot | Enabled |
| Erase All Flash Before Sketch Upload | Disabled (senão perde o pareamento da tomada) |

O `partitions.csv` deixa mais espaço para o programa e mantém as áreas do Zigbee nos mesmos endereços, então trocar de firmware não desfaz o pareamento.

Para o ESP32 DevKit V1 (`esp32_alert_v3`): Board **ESP32 Dev Module**, configurações padrão.

## Tomada testada

All Cordless T16A-ZB (Tuya TS011F, `_TZ3000_cehuw1lw`), Zigbee 3.0, 16 A.
