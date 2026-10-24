// Tomada Zigbee controlada pelo PC via cabo USB (ESP32-C6)
//
// PC (orquestrador) -> cabo USB -> ESP32-C6 -> Zigbee -> tomada
//
// Quem decide é o orquestrador (hardware_alert.py):
//   EPI ausente, invasão da área de risco ou queda -> "tomada off"
//   tudo limpo (com EPI e fora da área de risco)   -> "tomada on"
// O C6 só obedece. Sem Wi-Fi: o rádio fica todo para o Zigbee.
//
// Configuração na Arduino IDE (pacote "esp32 by Espressif" 3.x):
//   Placa ............ ESP32C6 Dev Module
//   Zigbee mode ...... Zigbee ZCZR (coordinator/router)
//   Partition Scheme . Custom (usa o partitions.csv desta pasta)
//   USB CDC On Boot .. Enabled
//   Erase All Flash .. Disabled (para não perder o pareamento da tomada)
//
// Comandos pela USB (115200, uma linha por comando). Respostas começam com "@":
//   tomada on | tomada off  -> @ok
//   status                  -> @status {json}
//   ping                    -> @pong
// Comandos manuais (Monitor Serial): ligar | desligar | parear | lista | info | reset
// Botão BOOT segurado 3 s: abre a rede Zigbee para parear a tomada (180 s)

#ifndef ZIGBEE_MODE_ZCZR
#error "Selecione Ferramentas > Zigbee mode > Zigbee ZCZR (coordinator/router)"
#endif

#include "Zigbee.h"

#define BOTAO_BOOT 9
#define ENDPOINT_SWITCH 5
#define TEMPO_PAREAMENTO 180  // segundos com a rede Zigbee aberta

// O estado da tomada é reenviado de tempos em tempos, caso ela perca um comando.
const unsigned long REENVIO_TOMADA_MS = 10000;

// Segurança: se o PC parar de mandar comandos (orquestrador fechou, cabo
// solto...), desligar a tomada depois de SEM_COMANDO_MS? O orquestrador
// reenvia o estado a cada 2 s enquanto está rodando.
const bool DESLIGAR_SE_PC_PARAR = false;
const unsigned long SEM_COMANDO_MS = 15000;

enum EstadoTomada { TOMADA_INDEFINIDA, TOMADA_LIGADA, TOMADA_DESLIGADA };
EstadoTomada estadoTomada = TOMADA_INDEFINIDA;
unsigned long ultimoEnvioTomada = 0;
unsigned long ultimoComandoPc = 0;
bool jaAvisouPareamento = false;
bool avisouPcParado = false;

ZigbeeSwitch zbSwitch = ZigbeeSwitch(ENDPOINT_SWITCH);
String linhaSerial;

const char* textoTomada() {
  return estadoTomada == TOMADA_LIGADA ? "ligada"
       : estadoTomada == TOMADA_DESLIGADA ? "desligada" : "indefinida";
}

void enviarTomada() {
  if (estadoTomada == TOMADA_LIGADA) zbSwitch.lightOn();
  else if (estadoTomada == TOMADA_DESLIGADA) zbSwitch.lightOff();
  ultimoEnvioTomada = millis();
}

void definirTomada(EstadoTomada novo) {
  if (novo == estadoTomada) return;  // o PC repete o estado; só age quando muda
  estadoTomada = novo;
  enviarTomada();
  Serial.printf("Tomada -> %s\n", novo == TOMADA_LIGADA ? "LIGAR" : "DESLIGAR");
}

void mostrarDispositivos() {
  std::list<zb_device_params_t *> dispositivos = zbSwitch.getBoundDevices();
  if (dispositivos.empty()) {
    Serial.println("Nenhuma tomada pareada ainda.");
    return;
  }
  for (const auto &d : dispositivos) {
    Serial.printf("Tomada: endpoint %d, endereço curto 0x%04x\n", d->endpoint, d->short_addr);
    // Ler fabricante/modelo também ajuda as tomadas Tuya a "aceitarem" o coordenador
    char *fabricante = zbSwitch.readManufacturer(d->endpoint, d->short_addr, d->ieee_addr);
    char *modelo = zbSwitch.readModel(d->endpoint, d->short_addr, d->ieee_addr);
    Serial.printf("  Fabricante: %s | Modelo: %s\n", fabricante ? fabricante : "?", modelo ? modelo : "?");
  }
}

void abrirRede() {
  Zigbee.openNetwork(TEMPO_PAREAMENTO);
  Serial.printf("Rede Zigbee aberta por %d s. Segure o botão da tomada ~5 s até o LED piscar rápido.\n",
                TEMPO_PAREAMENTO);
}

void processarLinha(String linha) {
  linha.trim();
  if (linha.length() == 0) return;
  String cmd = linha;
  cmd.toLowerCase();

  if (cmd == "tomada on" || cmd == "tomada off") {
    ultimoComandoPc = millis();
    avisouPcParado = false;
    definirTomada(cmd == "tomada on" ? TOMADA_LIGADA : TOMADA_DESLIGADA);
    Serial.println("@ok");
  } else if (cmd == "status") {
    char json[160];
    snprintf(json, sizeof(json),
             "{\"status\":\"ok\",\"placa\":\"c6\",\"conexao\":\"usb\",\"modo\":\"tomada\","
             "\"tomada_pareada\":%s,\"tomada\":\"%s\"}",
             zbSwitch.bound() ? "true" : "false", textoTomada());
    Serial.printf("@status %s\n", json);
  } else if (cmd == "ping") {
    Serial.println("@pong");
  } else if (cmd == "ligar") {
    zbSwitch.lightOn();
    Serial.println("-> LIGAR (manual)");
  } else if (cmd == "desligar") {
    zbSwitch.lightOff();
    Serial.println("-> DESLIGAR (manual)");
  } else if (cmd == "parear") {
    abrirRede();
  } else if (cmd == "lista") {
    mostrarDispositivos();
  } else if (cmd == "info") {
    Serial.printf("Tomada pareada: %s | tomada: %s\n", zbSwitch.bound() ? "sim" : "não", textoTomada());
  } else if (cmd == "reset") {
    Serial.println("Apagando a rede Zigbee e reiniciando...");
    delay(500);
    Zigbee.factoryReset();
  } else {
    Serial.println("@erro comando desconhecido (use: tomada on | tomada off | status | ping)");
  }
}

// Lê a USB sem travar o loop (monta a linha aos poucos)
void lerSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (linhaSerial.length()) processarLinha(linhaSerial);
      linhaSerial = "";
    } else if (linhaSerial.length() < 120) {
      linhaSerial += c;
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BOTAO_BOOT, INPUT_PULLUP);

  zbSwitch.setManufacturerAndModel("ThaisLab", "TomadaUSB");
  zbSwitch.allowMultipleBinding(true);
  Zigbee.addEndpoint(&zbSwitch);
  Zigbee.setRebootOpenNetwork(TEMPO_PAREAMENTO);
  if (!Zigbee.begin(ZIGBEE_COORDINATOR)) {
    Serial.println("Falha ao iniciar o Zigbee. Reiniciando...");
    delay(1000);
    ESP.restart();
  }
  Serial.println("Coordenador Zigbee iniciado.");
  Serial.println("Pronto. Comandos: tomada on | tomada off | status | ligar | desligar | parear | lista | info | reset");
}

void loop() {
  lerSerial();

  // Avisa quando a tomada parear
  if (!jaAvisouPareamento && zbSwitch.bound()) {
    Serial.println("Tomada pareada!");
    mostrarDispositivos();
    jaAvisouPareamento = true;
  }

  // Reenvia o estado da tomada de tempos em tempos
  if (estadoTomada != TOMADA_INDEFINIDA && millis() - ultimoEnvioTomada > REENVIO_TOMADA_MS) {
    enviarTomada();
  }

  // PC parou de mandar comandos
  if (ultimoComandoPc != 0 && !avisouPcParado && millis() - ultimoComandoPc > SEM_COMANDO_MS) {
    avisouPcParado = true;
    Serial.println("Sem comandos do PC há 15 s.");
    if (DESLIGAR_SE_PC_PARAR) definirTomada(TOMADA_DESLIGADA);
  }

  // Botão BOOT segurado 3 s: abre a rede Zigbee para parear
  if (digitalRead(BOTAO_BOOT) == LOW) {
    unsigned long inicio = millis();
    while (digitalRead(BOTAO_BOOT) == LOW) delay(10);
    if (millis() - inicio >= 3000) abrirRede();
  }

  delay(2);
}
