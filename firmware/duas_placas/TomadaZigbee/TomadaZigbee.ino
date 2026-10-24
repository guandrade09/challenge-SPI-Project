// Controle de tomada Zigbee (All Cordless T16A-ZB / Tuya) com ESP32-C6
//
// O ESP32-C6 cria a própria rede Zigbee (coordenador) e a tomada entra nela.
// Ele também recebe comandos do ESP32 do sinaleiro via ESP-NOW e repassa para a tomada.
// A cada 2 s ele responde ao sinaleiro com um "estou vivo" (status), para o
// sinaleiro (e o orquestrador, via GET /status) saberem que a ligação funciona.
//
// Configuração na Arduino IDE (pacote "esp32 by Espressif" versão 3.x):
//   Placa ............ ESP32C6 Dev Module
//   Zigbee mode ...... Zigbee ZCZR (coordinator/router)
//   Partition Scheme . Custom (usa o partitions.csv desta pasta)
//   USB CDC On Boot .. Enabled
//   Erase All Flash .. Disabled (para não perder o pareamento)
//   Monitor Serial ... 115200 baud, final de linha "New Line"
//
// Controles:
//   Botão BOOT, toque curto ...... alterna liga/desliga
//   Botão BOOT, segurar 3 s ...... abre a rede para parear (180 s)
//   Monitor Serial: ligar | desligar | alternar | parear | lista | status | reset
//   ESP-NOW (ESP32 do semáforo): ligar | desligar | ping

#ifndef ZIGBEE_MODE_ZCZR
#error "Selecione Ferramentas > Zigbee mode > Zigbee ZCZR (coordinator/router)"
#endif

#include "Zigbee.h"
#include <WiFi.h>
#include <esp_wifi.h>
#include <esp_now.h>

#define ENDPOINT_SWITCH 5
#define BOTAO_BOOT 9            // botão BOOT do ESP32-C6 DevKit
#define TEMPO_PAREAMENTO 180    // segundos com a rede aberta

// O sinaleiro está conectado a este Wi-Fi, então o ESP-NOW tem que usar o
// mesmo canal do roteador. O C6 procura a rede ao ligar e copia o canal.
// (O C6 não se conecta à rede, por isso não precisa da senha.)
#define REDE_WIFI "SEU_WIFI"  // mesmo nome de rede configurado no sinaleiro
#define CANAL_PADRAO 1          // usado se a rede não for encontrada

#define INTERVALO_STATUS_MS 2000   // de quanto em quanto tempo responde ao sinaleiro
#define SINALEIRO_PERDIDO_MS 10000 // sem mensagem do sinaleiro por esse tempo = perdeu contato

// Se não achar a rede ou ficar sem notícia do sinaleiro, testa os canais 1 a 13
// até ouvir o sinaleiro (ele manda mensagem a cada 3 s). Assim funciona mesmo
// se a busca da rede falhar ou se o roteador trocar de canal.
#define TEMPO_POR_CANAL_MS 4000

// ==== Mensagens ESP-NOW (iguais no código do sinaleiro) ====
#define CMD_DESLIGAR 0
#define CMD_LIGAR 1
#define CMD_PING 2   // só "estou vivo", não mexe na tomada

// Sinaleiro -> C6
typedef struct __attribute__((packed)) {
  char marca[4];   // "TOMA"
  uint32_t seq;    // número da mensagem
  uint8_t cmd;     // CMD_LIGAR, CMD_DESLIGAR ou CMD_PING
} MensagemTomada;

// C6 -> sinaleiro
typedef struct __attribute__((packed)) {
  char marca[4];        // "STAT"
  uint32_t ultimaSeq;   // última mensagem recebida do sinaleiro
  uint8_t pareada;      // 1 se a tomada está pareada
  uint8_t canal;        // canal Wi-Fi em uso
  uint8_t ultimoCmd;    // último comando aplicado na tomada (255 = nenhum)
} MensagemStatus;

ZigbeeSwitch zbSwitch = ZigbeeSwitch(ENDPOINT_SWITCH);

uint8_t enderecoBroadcast[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
bool espNowOk = false;
int canalAtual = CANAL_PADRAO;
bool jaMostrouDispositivos = false;

// Preenchidos pelo ESP-NOW e tratados no loop()
volatile int comandoRemoto = -1;
volatile uint32_t ultimaSeq = 0;
volatile unsigned long ultimoContatoSinaleiro = 0;
int ultimoComandoAplicado = -1;  // o sinaleiro repete o estado; só age quando muda
bool sinaleiroConectado = false;
unsigned long ultimoStatusEnviado = 0;
unsigned long ultimaTrocaCanal = 0;

void trocarCanal(int canal) {
  canalAtual = canal;
  esp_wifi_set_channel(canalAtual, WIFI_SECOND_CHAN_NONE);
  ultimaTrocaCanal = millis();
}

// Sem notícia do sinaleiro: passa para o próximo canal de tempos em tempos
void procurarSinaleiro() {
  bool semContato = ultimoContatoSinaleiro == 0 ||
                    millis() - ultimoContatoSinaleiro >= SINALEIRO_PERDIDO_MS;
  if (!semContato || millis() - ultimaTrocaCanal < TEMPO_POR_CANAL_MS) return;
  trocarCanal(canalAtual % 13 + 1);
  Serial.printf("Procurando o sinaleiro no canal %d...\n", canalAtual);
}

void mostrarDispositivos() {
  std::list<zb_device_params_t *> dispositivos = zbSwitch.getBoundDevices();
  if (dispositivos.empty()) {
    Serial.println("Nenhuma tomada pareada ainda.");
    return;
  }
  for (const auto &d : dispositivos) {
    Serial.printf("Tomada: endpoint %d, endereço curto 0x%04x\n", d->endpoint, d->short_addr);
    Serial.printf("  IEEE: %02X:%02X:%02X:%02X:%02X:%02X:%02X:%02X\n",
                  d->ieee_addr[7], d->ieee_addr[6], d->ieee_addr[5], d->ieee_addr[4],
                  d->ieee_addr[3], d->ieee_addr[2], d->ieee_addr[1], d->ieee_addr[0]);
    // Ler fabricante/modelo também ajuda as tomadas Tuya a "aceitarem" o coordenador
    char *fabricante = zbSwitch.readManufacturer(d->endpoint, d->short_addr, d->ieee_addr);
    char *modelo = zbSwitch.readModel(d->endpoint, d->short_addr, d->ieee_addr);
    Serial.printf("  Fabricante: %s\n", fabricante ? fabricante : "?");
    Serial.printf("  Modelo: %s\n", modelo ? modelo : "?");
  }
}

void mostrarStatus() {
  Serial.printf("Canal ESP-NOW: %d\n", canalAtual);
  Serial.printf("Tomada pareada: %s\n", zbSwitch.bound() ? "sim" : "não");
  if (ultimoContatoSinaleiro == 0) {
    Serial.println("Sinaleiro: nunca recebi mensagem dele");
  } else {
    Serial.printf("Sinaleiro: última mensagem há %lu ms\n", millis() - ultimoContatoSinaleiro);
  }
}

void abrirRede() {
  Zigbee.openNetwork(TEMPO_PAREAMENTO);
  Serial.printf("Rede aberta por %d s. Segure o botão da tomada ~5 s até o LED piscar rápido.\n",
                TEMPO_PAREAMENTO);
}

void ligar()    { zbSwitch.lightOn();     Serial.println("-> LIGAR"); }
void desligar() { zbSwitch.lightOff();    Serial.println("-> DESLIGAR"); }
void alternar() { zbSwitch.lightToggle(); Serial.println("-> ALTERNAR"); }

// Roda dentro da tarefa do Wi-Fi: só guarda o comando, o loop() executa
void aoReceberEspNow(const esp_now_recv_info_t *info, const uint8_t *dados, int tamanho) {
  if (tamanho != sizeof(MensagemTomada)) return;
  MensagemTomada msg;
  memcpy(&msg, dados, sizeof(msg));
  if (memcmp(msg.marca, "TOMA", 4) != 0) return;
  ultimoContatoSinaleiro = millis();
  if (msg.seq == ultimaSeq) return;  // mesma mensagem repetida
  ultimaSeq = msg.seq;
  if (msg.cmd == CMD_LIGAR || msg.cmd == CMD_DESLIGAR) {
    comandoRemoto = msg.cmd;
  }
}

void enviarStatus() {
  if (!espNowOk) return;
  MensagemStatus st;
  memcpy(st.marca, "STAT", 4);
  st.ultimaSeq = ultimaSeq;
  st.pareada = zbSwitch.bound() ? 1 : 0;
  st.canal = canalAtual;
  st.ultimoCmd = ultimoComandoAplicado < 0 ? 255 : ultimoComandoAplicado;
  esp_now_send(enderecoBroadcast, (uint8_t *)&st, sizeof(st));
}

int descobrirCanal() {
  Serial.printf("Procurando a rede \"%s\"...\n", REDE_WIFI);
  for (int tentativa = 0; tentativa < 3; tentativa++) {
    int n = WiFi.scanNetworks();
    for (int i = 0; i < n; i++) {
      if (WiFi.SSID(i) == REDE_WIFI) {
        int canal = WiFi.channel(i);
        WiFi.scanDelete();
        return canal;
      }
    }
    WiFi.scanDelete();
  }
  Serial.printf("Rede não encontrada. Usando o canal %d.\n", CANAL_PADRAO);
  return CANAL_PADRAO;
}

void iniciarEspNow() {
  WiFi.mode(WIFI_STA);
  trocarCanal(descobrirCanal());
  if (esp_now_init() != ESP_OK) {
    Serial.println("Falha ao iniciar o ESP-NOW.");
    return;
  }
  esp_now_register_recv_cb(aoReceberEspNow);

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, enderecoBroadcast, 6);
  peer.channel = 0;      // canal atual
  peer.encrypt = false;
  esp_now_add_peer(&peer);

  espNowOk = true;
  Serial.printf("ESP-NOW pronto no canal %d. MAC deste ESP: %s\n", canalAtual,
                WiFi.macAddress().c_str());
}

void setup() {
  Serial.begin(115200);
  pinMode(BOTAO_BOOT, INPUT_PULLUP);

  iniciarEspNow();

  zbSwitch.setManufacturerAndModel("ThaisLab", "ControleTomada");
  zbSwitch.allowMultipleBinding(true);  // permite controlar várias tomadas
  Zigbee.addEndpoint(&zbSwitch);

  // Toda vez que o ESP liga, a rede fica aberta para pareamento por um tempo
  Zigbee.setRebootOpenNetwork(TEMPO_PAREAMENTO);

  if (!Zigbee.begin(ZIGBEE_COORDINATOR)) {
    Serial.println("Falha ao iniciar o Zigbee. Reiniciando...");
    delay(1000);
    ESP.restart();
  }

  Serial.println();
  Serial.println("Coordenador Zigbee iniciado.");
  Serial.printf("Rede aberta por %d s. Coloque a tomada em modo de pareamento.\n", TEMPO_PAREAMENTO);
  Serial.println("Comandos: ligar | desligar | alternar | parear | lista | status | reset");
}

void loop() {
  // Avisa quando a tomada parear
  if (!jaMostrouDispositivos && zbSwitch.bound()) {
    Serial.println("Tomada pareada!");
    mostrarDispositivos();
    jaMostrouDispositivos = true;
  }

  // Avisa quando ganhar ou perder contato com o sinaleiro
  bool conectadoAgora = ultimoContatoSinaleiro != 0 &&
                        millis() - ultimoContatoSinaleiro < SINALEIRO_PERDIDO_MS;
  if (conectadoAgora != sinaleiroConectado) {
    sinaleiroConectado = conectadoAgora;
    if (conectadoAgora) {
      Serial.printf("Sinaleiro conectado no canal %d (recebendo mensagens via ESP-NOW).\n", canalAtual);
    } else {
      Serial.println("Perdi contato com o sinaleiro (nenhuma mensagem há 10 s). Vou procurar nos outros canais.");
    }
  }
  if (espNowOk) procurarSinaleiro();

  // Responde ao sinaleiro de tempos em tempos
  if (millis() - ultimoStatusEnviado >= INTERVALO_STATUS_MS) {
    ultimoStatusEnviado = millis();
    enviarStatus();
  }

  // Comando vindo do sinaleiro
  if (comandoRemoto >= 0) {
    int cmd = comandoRemoto;
    comandoRemoto = -1;
    if (cmd != ultimoComandoAplicado) {
      ultimoComandoAplicado = cmd;
      Serial.print("[ESP-NOW] ");
      if (cmd == CMD_DESLIGAR) {
        desligar();
      } else if (cmd == CMD_LIGAR) {
        ligar();
      }
      enviarStatus();  // confirma na hora para o sinaleiro
    }
  }

  // Botão BOOT: toque curto alterna, segurar 3 s abre a rede
  if (digitalRead(BOTAO_BOOT) == LOW) {
    unsigned long inicio = millis();
    while (digitalRead(BOTAO_BOOT) == LOW) delay(10);
    unsigned long duracao = millis() - inicio;
    if (duracao >= 3000) {
      abrirRede();
    } else if (duracao >= 50) {
      alternar();
      ultimoComandoAplicado = -1;  // próximo comando remoto volta a valer
    }
  }

  // Comandos pelo Monitor Serial
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toLowerCase();

    if (cmd == "ligar" || cmd == "on") {
      ligar();
      ultimoComandoAplicado = -1;  // após comando manual, o próximo comando remoto volta a valer
    } else if (cmd == "desligar" || cmd == "off") {
      desligar();
      ultimoComandoAplicado = -1;
    } else if (cmd == "alternar" || cmd == "t") {
      alternar();
      ultimoComandoAplicado = -1;
    } else if (cmd == "parear") {
      abrirRede();
    } else if (cmd == "lista") {
      mostrarDispositivos();
    } else if (cmd == "status") {
      mostrarStatus();
    } else if (cmd == "reset") {
      Serial.println("Apagando a rede Zigbee e reiniciando...");
      delay(500);
      Zigbee.factoryReset();
    } else if (cmd.length() > 0) {
      Serial.println("Comando desconhecido. Use: ligar | desligar | alternar | parear | lista | status | reset");
    }
  }

  delay(10);
}
