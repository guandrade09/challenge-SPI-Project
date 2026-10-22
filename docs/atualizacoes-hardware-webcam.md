# Atualizações: sinaleiro físico, tomada Tuya e webcam local

Branch: `hardware` (criada a partir de `frontend`) · Data: 22/10/2026

Portado do repositório de teste [thiiss-challenge-SPI-Project-teste](https://github.com/thiiss/thiiss-challenge-SPI-Project-teste) (commits `af240db` e `d958d1a`, de 21–23/09/2026) e adaptado ao orquestrador atual, que roda **um pipeline por câmera**.

Este documento descreve o que foi adicionado ou alterado nesta rodada de mudanças. Há duas frentes:

1. **Hardware de alerta:** o orquestrador passa a acender o sinaleiro (ESP32) e a cortar a energia por uma tomada Tuya quando há risco.
2. **Webcam do notebook:** ela pode ser cadastrada como câmera pelo frontend.

---

## 1. Sinaleiro físico e tomada Tuya

**Arquivo novo:** [`orquestrador/hardware_alert.py`](../orquestrador/hardware_alert.py)

O módulo é portado da Fase 03 e adaptado ao orquestrador atual. Cada câmera roda o seu pipeline, e todas compartilham o mesmo hardware físico.

### Estados do sinaleiro

| Estado | Quando acende | Buzzer | Tomada |
|---|---|---|---|
| 🔴 Vermelho | Queda **ou** invasão de zona de risco (risco grave) | Soa | **Desliga** |
| 🟠 Laranja | EPI ausente (risco leve) | Soa | Não altera |
| 🟡 Amarelo | Estado neutro, aceso sozinho pelo firmware do ESP32 | Não soa | Não altera |
| 🟢 Verde | Tudo limpo: há pessoas e todas estão com EPI e fora da zona | Não soa | Religa, se estava cortada |

### Regras de decisão

- **Prioridade:** vermelho vence laranja quando os dois ocorrem juntos.
- **Várias câmeras, um só hardware:** basta **uma** câmera em risco para acender o alerta (OU). Para ir ao verde, **todas** as câmeras com gente precisam estar limpas (E).
- **Corte da tomada:** só queda ou invasão de zona desligam a tomada, e o comando é enviado uma única vez, na subida do risco. EPI ausente sozinho **não** desliga a tomada.
- **Religar:** a tomada só volta quando o sistema confirma "tudo limpo" por `CLEAR_FRAMES_TO_GREEN` (15) frames seguidos. Ela nunca volta ao sair do vermelho direto para o amarelo.
- **Heartbeat:** o estado do LED é reenviado a cada 2 s (`LED_REFRESH_INTERVAL`), abaixo do watchdog de 5 s do ESP32. A tomada não tem watchdog.
- **Falhas de comunicação:** são apenas registradas no log. Não derrubam o pipeline, porque os envios rodam em threads.

### Escolha da tomada (`PLUG_ATIVA`)

As credenciais das tomadas (`device_id` e `local_key`) **não ficam no código**: quem tem a `local_key` consegue controlar a tomada pela rede. Elas ficam em `orquestrador/tuya_plugs.json`, que está no `.gitignore`.

Para configurar numa máquina nova:

```powershell
cd orquestrador
copy tuya_plugs.example.json tuya_plugs.json
# edite tuya_plugs.json com device_id, local_key, ip e version de cada tomada
```

Sem esse arquivo, o orquestrador sobe normalmente: o sinaleiro funciona e a tomada fica desativada (aparece um aviso `[TUYA]` no log).

Hoje há duas tomadas cadastradas:

| Nome | Uso |
|---|---|
| `principal` | Tomada da apresentação final (padrão) |
| `teste` | AVATTO Wifi Smart Socket 16A, usada para testes em outra rede |

A tomada é escolhida pela variável de ambiente `PLUG_ATIVA` (padrão: `teste`). Um nome inválido faz o orquestrador falhar ao iniciar, listando as opções válidas. Os logs mostram a tomada em uso, por exemplo `[TUYA:teste] desligar: ok`.

### Variáveis de ambiente

| Variável | Efeito | Padrão |
|---|---|---|
| `PLUG_ATIVA` | Qual tomada de `tuya_plugs.json` usar | `teste` |
| `PLUG_IP` | Sobrescreve o IP da tomada ativa | IP do `tuya_plugs.json` |
| `PLUG_TESTE_IP` | Igual a `PLUG_IP`, só para a tomada `teste` (compatibilidade) | — |
| `TUYA_PLUGS_FILE` | Caminho de outro arquivo de tomadas | `orquestrador/tuya_plugs.json` |
| `ESP_IP` | IP do ESP32 (sinaleiro) | valor fixo no código |

Os IPs mudam a cada rede Wi-Fi. Para descobrir o IP de uma tomada Tuya, use `python -m tinytuya scan`.

**Exemplo (PowerShell) para testar com a tomada de teste:**

```powershell
$env:PLUG_ATIVA = "teste"
$env:PLUG_IP    = "<ip da tomada nesse wifi>"
$env:ESP_IP     = "<ip do ESP32 nesse wifi>"
python main.py
```

Para a apresentação, defina `$env:PLUG_ATIVA = "principal"` e confira os IPs da rede do dia.

### Como o `main.py` usa o módulo

Veja a seção 3.

---

## 2. Script de teste do ESP32

**Arquivo novo:** [`orquestrador/test_esp32_led.py`](../orquestrador/test_esp32_led.py)

O script testa o firmware do sinaleiro direto pelo HTTP, sem o orquestrador. Ele roda uma bateria de testes:

- **Servidor:** `GET /` responde 200.
- **LEDs:** vermelho, laranja e verde ligam e desligam.
- **Validação de entrada:** corpo vazio, JSON inválido, `led` inválido e `state` inválido devolvem 400.
- **Exclusão mútua:** ligar vermelho depois de verde é aceito.
- **Watchdog:** teste opcional com `--watchdog`.

Opções úteis:

```
python test_esp32_led.py --ip 10.0.0.5            # outro IP
python test_esp32_led.py --only vermelho --loop   # pisca um LED até Ctrl+C (útil com multímetro)
python test_esp32_led.py --delay 4                # pausa maior entre os passos
```

O IP padrão agora vem da variável `ESP_IP`, igual ao `hardware_alert.py`. Antes, os dois arquivos tinham IPs diferentes.

---

## 3. Alterações no orquestrador ([`orquestrador/main.py`](../orquestrador/main.py))

1. **Integração com o hardware:**
   - `_run_sector_pipeline` (um por câmera) chama `hardware_alert.report_sector(...)` a cada frame processado, com três informações ao vivo: EPI ausente, queda ou invasão de zona, e se há pessoa presente. A chave de cada câmera é `"<setor>/<id da câmera>"`.
   - Usa o risco **ao vivo** do frame, e não o confirmado (que tem cooldown para o log no banco). Senão o sinaleiro pisca vermelho/verde no meio do risco.
   - Ao encerrar o pipeline de uma câmera, chama `hardware_alert.remover_setor(...)`. Isso evita que a flag antiga bloqueie o verde para sempre.
2. **Webcam local:** a função `_as_local_device` converte uma `streamUrl` puramente numérica (`"0"`, `"1"`, ...) em `int`, tanto em `_make_resolve_fn` quanto em `_make_camera_resolve_fn`. Assim a câmera é aberta via `cv2.VideoCapture` local (`CAP_DSHOW`), na mesma convenção do `CAMERA_SOURCE` de ambiente.
3. A correção de "reinício em loop" do `cam_ids` do repositório de teste **não foi necessária**: o orquestrador atual já usa a mesma assinatura (`_camera_pipeline_signature`) nos dois lugares.

---

## 4. Frontend: cadastro de webcam local

**Arquivos:**
- [`ButtonAddCam.jsx`](../frontend/src/features/cameraPage/components/ButtonAddCam.jsx)
- [`ButtonEditCam.jsx`](../frontend/src/features/cameraPage/components/ButtonEditCam.jsx)

- **Botão novo:** "Usar webcam do notebook (em vez de câmera de rede)", com ícone `Webcam` do `lucide-react`.
- **Campo do índice:** com o botão ativo, o campo de IP/URL dá lugar a "Índice do dispositivo". O padrão é `0`, a webcam principal. Com mais de uma câmera USB, tente 1, 2, e assim por diante.
- **Como é salvo:** a câmera fica com `ip: "local"` e `streamUrl` igual ao índice, por exemplo `"0"`. É essa convenção que o orquestrador reconhece (seção 3, item 2).
- **Edição:** ao editar, uma `streamUrl` numérica reabre o modal com o botão ativado e o índice preenchido.
- **Validação:** sem webcam local, o IP/URL passa a ser obrigatório. O formulário não envia mais com o campo vazio.

---

## 5. Câmera VLC

**Arquivo:** [`ml_service/inference/vlc_camera.py`](../ml_service/inference/vlc_camera.py)

- Adicionado `:rtsp-tcp`, que força o vídeo RTSP a trafegar por TCP. Necessário em redes (ex.: campus) que bloqueiam UDP: a câmera "conecta", mas nenhum frame chega.
- A liberação de memória do libvlc já existia na versão do grupo e foi mantida.
- Obs.: hoje o `camera.py` usa OpenCV/FFmpeg direto e o VLC está fora do fluxo; a mudança fica pronta para quando ele voltar.

O setor `teste` do `analise_config.json` do repositório de teste **não foi trazido**: a configuração agora é por câmera (`camera:<id>`) e é feita pela tela.

---

## 6. Dependências

**Arquivo:** [`requirements.txt`](../requirements.txt)

- Adicionado `tinytuya>=1.13.0`, usado para controlar a tomada Tuya.

---

## 7. Arquivos que não devem ser commitados

Contêm credenciais ou dados de dispositivos Tuya e estão no `.gitignore` (ou devem ficar só na sua máquina):

- `orquestrador/tuya_plugs.json` (credenciais das tomadas)
- `snapshot.json`, `devices.json`, `tinytuya.json`, `tuya-raw.json` (gerados pelo `tinytuya`)

## 8. Firmware do ESP32

O firmware do sinaleiro (`esp32_alert_v4.ino`) não está neste repositório. Ele expõe `GET /` e `POST /led` com corpo `{"led": "vermelho|laranja|verde", "state": "on|off"}`, e tem um watchdog de 5 s que volta para o amarelo se não receber nada.
