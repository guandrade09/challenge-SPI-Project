// Sinaleiro + tomada Zigbee em um único ESP32-C6
//
// O C6 faz tudo sozinho:
//   - recebe os comandos do orquestrador pelo cabo USB (padrão) ou pelo Wi-Fi
//   - acende os LEDs vermelho/laranja/amarelo/verde e o buzzer
//   - é o coordenador Zigbee e liga/desliga a tomada
//
// Regras:
//   vermelho ou laranja -> buzzer toca e a tomada DESLIGA
//   verde               -> tomada LIGA
//   amarelo             -> ligado e esperando comando: acende sozinho quando nenhum
//                          outro está aceso; tomada não muda
//   ao ligar            -> todos os LEDs (e o buzzer) acesos por 2 s
//   sem comando por TIMEOUT_MS -> volta para o amarelo
//
// Configuração na Arduino IDE (pacote "esp32 by Espressif" 3.x):
//   Placa ............ ESP32C6 Dev Module
//   Zigbee mode ...... Zigbee ZCZR (coordinator/router)
//   Partition Scheme . Custom (usa o partitions.csv desta pasta)
//   USB CDC On Boot .. Enabled
//   Erase All Flash .. Disabled (para não perder o pareamento da tomada)
//
// Comandos pela USB (115200, uma linha por comando). Respostas começam com "@":
//   led vermelho|laranja|verde on|off  -> @ok  ou  @erro <motivo>
//   status                             -> @status {json}
//   ping                               -> @pong
// Comandos manuais (Monitor Serial): ligar | desligar | parear | lista | info | reset
//
// Wi-Fi (só se USAR_WIFI = true):
//   POST /led {"led":"vermelho","state":"on"} | GET /status | GET /
//
// Botão BOOT segurado 3 s: abre a rede Zigbee para parear a tomada (180 s)

#ifndef ZIGBEE_MODE_ZCZR
#error "Selecione Ferramentas > Zigbee mode > Zigbee ZCZR (coordinator/router)"
#endif

#include "Zigbee.h"
#include <WiFi.h>
#include <WebServer.h>

// ==== CONEXÃO COM O ORQUESTRADOR ====
// false: só pelo cabo USB (o Wi-Fi nem é ligado; deixa o rádio todo para o Zigbee).
// true:  também conecta no Wi-Fi e aceita os comandos por HTTP.
const bool USAR_WIFI = false;
const char* ssid = "SEU_WIFI";          // troque pelo nome da sua rede (2,4 GHz)
const char* password = "SUA_SENHA";    // troque pela senha (não faça commit da senha real)

// ==== PINOS (ver firmware/pinos_esp32c6.png) ====
#define LED_VERMELHO 18
#define LED_LARANJA  19
#define LED_AMARELO  20
#define LED_VERDE    21
#define BUZZER_PIN   22   // base do transistor (via resistor 1 kΩ)
#define BOTAO_BOOT   9

// ==== TESTE AO LIGAR ====
// Ao ligar, acende todos os LEDs (e o buzzer) por esse tempo para mostrar que
// a placa ligou. Depois fica só o amarelo: ligado e esperando comando.
const unsigned long TESTE_AO_LIGAR_MS = 2000;
const bool BUZZER_NO_TESTE = true;  // false = testa só os LEDs, sem apitar

// ==== TIMEOUT (watchdog) ====
// Se vermelho, laranja ou verde não receberem comando novo em TIMEOUT_MS,
// apagam sozinhos e o sistema volta pro amarelo.
const unsigned long TIMEOUT_MS = 5000;

// ==== TOMADA ====
// Se quiser que a tomada também desligue quando voltar pro amarelo por timeout
// (por segurança, caso o orquestrador pare de mandar comandos), troque para true.
const bool DESLIGAR_TOMADA_NO_TIMEOUT = false;
// O estado da tomada é reenviado de tempos em tempos, caso ela perca um comando.
const unsigned long REENVIO_TOMADA_MS = 10000;
#define ENDPOINT_SWITCH 5
#define TEMPO_PAREAMENTO 180  // segundos com a rede Zigbee aberta

// ==== ESTADO ====
bool vermelhoOn = false;
bool laranjaOn = false;
bool verdeOn = false;
unsigned long lastUpdate = 0;

enum EstadoTomada { TOMADA_INDEFINIDA, TOMADA_LIGADA, TOMADA_DESLIGADA };
EstadoTomada estadoTomada = TOMADA_INDEFINIDA;
unsigned long ultimoEnvioTomada = 0;
bool jaAvisouPareamento = false;

WebServer server(80);
ZigbeeSwitch zbSwitch = ZigbeeSwitch(ENDPOINT_SWITCH);
String linhaSerial;

// ==== TOMADA (Zigbee) ====
void enviarTomada() {
  if (estadoTomada == TOMADA_LIGADA) zbSwitch.lightOn();
  else if (estadoTomada == TOMADA_DESLIGADA) zbSwitch.lightOff();
  ultimoEnvioTomada = millis();
}

void definirTomada(EstadoTomada novo) {
  if (novo == estadoTomada) return;
  estadoTomada = novo;
  enviarTomada();
  Serial.printf("Tomada -> %s\n", novo == TOMADA_LIGADA ? "LIGAR" : "DESLIGAR");
}

void atualizarTomada() {
  if (vermelhoOn || laranjaOn) definirTomada(TOMADA_DESLIGADA);
  else if (verdeOn) definirTomada(TOMADA_LIGADA);
  // amarelo: não muda a tomada
}

const char* textoTomada() {
  return estadoTomada == TOMADA_LIGADA ? "ligada"
       : estadoTomada == TOMADA_DESLIGADA ? "desligada" : "indefinida";
}

// ==== LEDs ====
// Amarelo é sempre o "senão": só acende quando os outros três estão apagados.
void aplicarLeds() {
  digitalWrite(LED_VERMELHO, vermelhoOn ? HIGH : LOW);
  digitalWrite(LED_LARANJA,  laranjaOn  ? HIGH : LOW);
  digitalWrite(LED_VERDE,    verdeOn    ? HIGH : LOW);
  digitalWrite(LED_AMARELO, (!vermelhoOn && !laranjaOn && !verdeOn) ? HIGH : LOW);
  // Buzzer toca com vermelho (risco grave: queda/zona) OU laranja (EPI ausente)
  digitalWrite(BUZZER_PIN, (vermelhoOn || laranjaOn) ? HIGH : LOW);

  atualizarTomada();
}

// Aplica um comando de LED. Retorna "" se deu certo, ou o motivo do erro.
String comandoLed(const String& led, const String& state) {
  if (state != "on" && state != "off") return "state invalido";
  bool ligar = (state == "on");
  if (led == "vermelho") {
    vermelhoOn = ligar;
    if (ligar) { laranjaOn = false; verdeOn = false; }
  } else if (led == "laranja") {
    laranjaOn = ligar;
    if (ligar) { vermelhoOn = false; verdeOn = false; }
  } else if (led == "verde") {
    verdeOn = ligar;
    if (ligar) { vermelhoOn = false; laranjaOn = false; }
  } else {
    return "led invalido (use vermelho, laranja ou verde)";
  }
  lastUpdate = millis();
  aplicarLeds();
  return "";
}

String statusJson(const char* conexao) {
  const char* led = vermelhoOn ? "vermelho" : laranjaOn ? "laranja" : verdeOn ? "verde" : "amarelo";
  char json[256];
  snprintf(json, sizeof(json),
           "{\"status\":\"ok\",\"placa\":\"c6\",\"conexao\":\"%s\",\"canal\":%d,\"rssi\":%d,"
           "\"led\":\"%s\",\"tomada_pareada\":%s,\"tomada\":\"%s\"}",
           conexao, USAR_WIFI ? WiFi.channel() : 0, USAR_WIFI ? WiFi.RSSI() : 0, led,
           zbSwitch.bound() ? "true" : "false", textoTomada());
  return String(json);
}

// ==== HTTP (só com USAR_WIFI) ====
String extrairValorJson(const String& body, const String& chave) {
  String busca = "\"" + chave + "\"";
  int idx = body.indexOf(busca);
  if (idx == -1) return "";
  idx = body.indexOf(':', idx + busca.length());
  if (idx == -1) return "";
  idx++;
  while (idx < (int)body.length() && body[idx] == ' ') idx++;
  if (idx >= (int)body.length() || body[idx] != '"') return "";
  idx++;
  int fim = body.indexOf('"', idx);
  if (fim == -1) return "";
  return body.substring(idx, fim);
}

void handleLed() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"status\":\"erro\",\"msg\":\"corpo vazio\"}");
    return;
  }
  String body = server.arg("plain");
  String led = extrairValorJson(body, "led");
  String state = extrairValorJson(body, "state");
  String erro = (led.length() && state.length()) ? comandoLed(led, state) : "JSON invalido";
  if (erro.length()) {
    server.send(400, "application/json", "{\"status\":\"erro\",\"msg\":\"" + erro + "\"}");
    return;
  }
  Serial.printf("[HTTP] %s -> %s\n", led.c_str(), state.c_str());
  server.send(200, "application/json", "{\"status\":\"ok\"}");
}

void handleStatus() { server.send(200, "application/json", statusJson("wifi")); }
void handleRoot() { server.send(200, "text/plain", "ESP32 alerta EPI - online"); }
void handleNotFound() { server.send(404, "text/plain", "Not found"); }

// ==== Zigbee: utilidades ====
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

void mostrarInfo() {
  if (USAR_WIFI) {
    Serial.printf("Wi-Fi: %s | IP: %s | canal %d | sinal %d dBm\n",
                  WiFi.status() == WL_CONNECTED ? "conectado" : "DESCONECTADO",
                  WiFi.localIP().toString().c_str(), WiFi.channel(), WiFi.RSSI());
  } else {
    Serial.println("Wi-Fi: desligado (comandos pelo cabo USB)");
  }
  Serial.printf("Tomada pareada: %s | tomada: %s\n", zbSwitch.bound() ? "sim" : "não", textoTomada());
}

// ==== Comandos pela USB ====
void processarLinha(String linha) {
  linha.trim();
  if (linha.length() == 0) return;
  String cmd = linha;
  cmd.toLowerCase();

  if (cmd.startsWith("led ")) {
    // "led <cor> <on|off>"
    int esp = cmd.indexOf(' ', 4);
    String led = esp > 0 ? cmd.substring(4, esp) : "";
    String state = esp > 0 ? cmd.substring(esp + 1) : "";
    led.trim();
    state.trim();
    String erro = comandoLed(led, state);
    if (erro.length()) Serial.println("@erro " + erro);
    else Serial.println("@ok");
  } else if (cmd == "status") {
    Serial.println("@status " + statusJson(USAR_WIFI ? "wifi+usb" : "usb"));
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
    mostrarInfo();
  } else if (cmd == "reset") {
    Serial.println("Apagando a rede Zigbee e reiniciando...");
    delay(500);
    Zigbee.factoryReset();
  } else {
    Serial.println("@erro comando desconhecido");
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

// ==== SETUP / LOOP ====
void conectarWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  // Não desligar a economia de energia do Wi-Fi: o rádio é dividido com o
  // Zigbee, e é nesses intervalos que o Zigbee consegue usar a antena.
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao Wi-Fi");
  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < 20000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("Conectado! IP: %s (canal %d, sinal %d dBm)\n",
                  WiFi.localIP().toString().c_str(), WiFi.channel(), WiFi.RSSI());
  } else {
    Serial.println("Não conectou ao Wi-Fi em 20 s. Sigo tentando em segundo plano.");
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(LED_VERMELHO, OUTPUT);
  pinMode(LED_LARANJA, OUTPUT);
  pinMode(LED_AMARELO, OUTPUT);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BOTAO_BOOT, INPUT_PULLUP);

  // Teste ao ligar: tudo aceso por alguns segundos
  digitalWrite(LED_VERMELHO, HIGH);
  digitalWrite(LED_LARANJA, HIGH);
  digitalWrite(LED_AMARELO, HIGH);
  digitalWrite(LED_VERDE, HIGH);
  digitalWrite(BUZZER_PIN, BUZZER_NO_TESTE ? HIGH : LOW);
  Serial.println("Teste ao ligar: todos os LEDs acesos");
  delay(TESTE_AO_LIGAR_MS);

  // Estado inicial: só o amarelo aceso (ligado e esperando comando), tomada sem comando
  lastUpdate = millis();
  aplicarLeds();

  if (USAR_WIFI) conectarWifi();

  zbSwitch.setManufacturerAndModel("ThaisLab", "SinaleiroC6");
  zbSwitch.allowMultipleBinding(true);
  Zigbee.addEndpoint(&zbSwitch);
  Zigbee.setRebootOpenNetwork(TEMPO_PAREAMENTO);
  if (!Zigbee.begin(ZIGBEE_COORDINATOR)) {
    Serial.println("Falha ao iniciar o Zigbee. Reiniciando...");
    delay(1000);
    ESP.restart();
  }
  Serial.println("Coordenador Zigbee iniciado.");

  if (USAR_WIFI) {
    server.on("/", HTTP_GET, handleRoot);
    server.on("/led", HTTP_POST, handleLed);
    server.on("/status", HTTP_GET, handleStatus);
    server.onNotFound(handleNotFound);
    server.begin();
    Serial.println("Servidor HTTP iniciado na porta 80");
  }
  Serial.println("Pronto. Comandos: led <cor> <on|off> | status | ligar | desligar | parear | lista | info | reset");
}

void loop() {
  if (USAR_WIFI) server.handleClient();
  lerSerial();

  // Avisa quando a tomada parear
  if (!jaAvisouPareamento && zbSwitch.bound()) {
    Serial.println("Tomada pareada!");
    mostrarDispositivos();
    jaAvisouPareamento = true;
  }

  // Watchdog: sem comando novo por TIMEOUT_MS -> volta pro amarelo
  if ((vermelhoOn || laranjaOn || verdeOn) && (millis() - lastUpdate > TIMEOUT_MS)) {
    Serial.println("Timeout: nenhuma atualização recebida - voltando para amarelo");
    vermelhoOn = false;
    laranjaOn = false;
    verdeOn = false;
    aplicarLeds();
    if (DESLIGAR_TOMADA_NO_TIMEOUT) definirTomada(TOMADA_DESLIGADA);
  }

  // Reenvia o estado da tomada de tempos em tempos
  if (estadoTomada != TOMADA_INDEFINIDA && millis() - ultimoEnvioTomada > REENVIO_TOMADA_MS) {
    enviarTomada();
  }

  // Botão BOOT segurado 3 s: abre a rede Zigbee para parear
  if (digitalRead(BOTAO_BOOT) == LOW) {
    unsigned long inicio = millis();
    while (digitalRead(BOTAO_BOOT) == LOW) delay(10);
    if (millis() - inicio >= 3000) abrirRede();
  }

  delay(2);
}
