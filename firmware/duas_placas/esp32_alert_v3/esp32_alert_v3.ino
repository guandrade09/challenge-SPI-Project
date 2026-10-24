#include <WiFi.h>
#include <WebServer.h>
#include <esp_now.h>
// Obs: parsing do JSON é feito manualmente abaixo, sem precisar da lib ArduinoJson.

// ==== CONFIGURAÇÃO DE REDE ====
const char* ssid = "SEU_WIFI";          // troque pelo nome da sua rede (2,4 GHz)
const char* password = "SUA_SENHA";    // troque pela senha (não faça commit da senha real)

// ==== PINOS ====
#define BUZZER_PIN   18   // controla a BASE do transistor (via resistor 1kΩ)
#define LED_VERMELHO 21
#define LED_AMARELO  19
#define LED_VERDE    22
#define LED_LARANJA  23   // risco de EPI (ausência de equipamento) — não é risco grave

// ==== TIMEOUT (watchdog) ====
// Se um LED aceso (vermelho, laranja ou verde) não receber comando novo em
// TIMEOUT_MS, ele desliga sozinho e o sistema volta pro amarelo.
const unsigned long TIMEOUT_MS = 5000;

// ==== ESTADO DE CADA LED INDIVIDUAL ====
// Vermelho, laranja e verde são comandados diretamente (mutuamente exclusivos
// entre si). O amarelo NUNCA é comandado: ele acende sozinho sempre que
// nenhum dos outros três estiver ligado.
bool vermelhoOn = false;
bool laranjaOn = false;
bool verdeOn = false;
unsigned long lastUpdate = 0;

WebServer server(80);

// ==== TOMADA ZIGBEE (via ESP-NOW -> ESP32-C6 -> Zigbee) ====
//   vermelho ou laranja -> desliga a tomada
//   verde               -> liga a tomada
//   amarelo (nenhum)    -> tomada fica como estava
// Se quiser que a tomada também desligue quando voltar pro amarelo por timeout
// (por segurança, caso o sistema pare de mandar comandos), troque para true.
const bool DESLIGAR_TOMADA_NO_TIMEOUT = false;

// O estado da tomada é reenviado de tempos em tempos. Assim, se uma mensagem
// se perder ou o C6 reiniciar, ele recebe o estado certo logo em seguida.
const unsigned long REENVIO_TOMADA_MS = 3000;

// Sem resposta do C6 por esse tempo = C6 desconectado (ele responde a cada 2 s)
const unsigned long C6_PERDIDO_MS = 7000;

// ==== Mensagens ESP-NOW (iguais no código do C6) ====
#define CMD_DESLIGAR 0
#define CMD_LIGAR 1
#define CMD_PING 2   // só "estou vivo", não mexe na tomada

// Sinaleiro -> C6
typedef struct __attribute__((packed)) {
  char marca[4];   // "TOMA": identifica que a mensagem é nossa
  uint32_t seq;    // número da mensagem, para o C6 ignorar repetições
  uint8_t cmd;     // CMD_LIGAR, CMD_DESLIGAR ou CMD_PING
} MensagemTomada;

// C6 -> sinaleiro
typedef struct __attribute__((packed)) {
  char marca[4];        // "STAT"
  uint32_t ultimaSeq;   // última mensagem que o C6 recebeu daqui
  uint8_t pareada;      // 1 se a tomada está pareada no C6
  uint8_t canal;        // canal Wi-Fi do C6
  uint8_t ultimoCmd;    // último comando aplicado na tomada (255 = nenhum)
} MensagemStatus;

uint8_t enderecoBroadcast[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
uint32_t proximaSeq;
uint32_t ultimaSeqEnviada = 0;
bool espNowOk = false;
int estadoTomada = -1;            // -1 = ainda não definido
unsigned long ultimoEnvioTomada = 0;

// Último status recebido do C6 (preenchido pelo ESP-NOW)
volatile unsigned long c6UltimoContato = 0;   // 0 = nunca respondeu
volatile uint32_t c6UltimaSeq = 0;
volatile uint8_t c6Pareada = 0;
volatile uint8_t c6Canal = 0;
volatile uint8_t c6UltimoCmd = 255;
bool c6Conectado = false;

bool c6Online() {
  return c6UltimoContato != 0 && millis() - c6UltimoContato < C6_PERDIDO_MS;
}

// Envia uma mensagem para o ESP32-C6 (algumas vezes, por garantia)
void enviarTomada(uint8_t cmd) {
  if (!espNowOk) return;
  MensagemTomada msg;
  memcpy(msg.marca, "TOMA", 4);
  msg.seq = proximaSeq++;
  msg.cmd = cmd;
  ultimaSeqEnviada = msg.seq;
  for (int i = 0; i < 3; i++) {
    esp_now_send(enderecoBroadcast, (uint8_t *)&msg, sizeof(msg));
    delay(5);
  }
  ultimoEnvioTomada = millis();
}

// Roda dentro da tarefa do Wi-Fi: só guarda o status do C6
void aoReceberEspNow(const esp_now_recv_info_t *info, const uint8_t *dados, int tamanho) {
  if (tamanho != sizeof(MensagemStatus)) return;
  MensagemStatus st;
  memcpy(&st, dados, sizeof(st));
  if (memcmp(st.marca, "STAT", 4) != 0) return;
  c6UltimaSeq = st.ultimaSeq;
  c6Pareada = st.pareada;
  c6Canal = st.canal;
  c6UltimoCmd = st.ultimoCmd;
  c6UltimoContato = millis();
}

// Define o estado da tomada; só envia na hora se mudou
void definirTomada(uint8_t cmd) {
  if (cmd == estadoTomada) return;
  estadoTomada = cmd;
  enviarTomada(cmd);
  Serial.printf("Tomada -> %s\n", cmd == CMD_LIGAR ? "LIGAR" : "DESLIGAR");
}

// Decide o estado da tomada a partir dos LEDs
void atualizarTomada() {
  if (vermelhoOn || laranjaOn) {
    definirTomada(CMD_DESLIGAR);
  } else if (verdeOn) {
    definirTomada(CMD_LIGAR);
  }
  // amarelo: não muda a tomada
}

// Chamar depois do Wi-Fi conectar: o ESP-NOW usa o mesmo canal do roteador
void iniciarEspNow() {
  if (esp_now_init() != ESP_OK) {
    Serial.println("Falha ao iniciar o ESP-NOW (a tomada não será controlada).");
    return;
  }
  esp_now_register_recv_cb(aoReceberEspNow);
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, enderecoBroadcast, 6);
  peer.channel = 0;      // 0 = canal atual (o mesmo do roteador)
  peer.encrypt = false;
  esp_now_add_peer(&peer);
  proximaSeq = esp_random();
  espNowOk = true;
  Serial.printf("ESP-NOW pronto no canal %d\n", WiFi.channel());
}

// GET /status -> estado do sinaleiro e da ligação com o C6 da tomada (lido pelo orquestrador)
void handleStatus() {
  bool online = c6Online();
  // O C6 confirma a última mensagem que recebeu. Aceita a anterior também,
  // porque a confirmação pode estar a caminho.
  bool recebe = online && (c6UltimaSeq == ultimaSeqEnviada || c6UltimaSeq + 1 == ultimaSeqEnviada);
  const char *tomada = c6UltimoCmd == CMD_LIGAR ? "ligada"
                     : c6UltimoCmd == CMD_DESLIGAR ? "desligada" : "indefinida";
  char json[320];
  snprintf(json, sizeof(json),
           "{\"status\":\"ok\",\"canal\":%d,\"espnow\":%s,"
           "\"c6_online\":%s,\"c6_visto_ha_ms\":%ld,\"c6_canal\":%d,"
           "\"c6_recebe_comandos\":%s,\"tomada_pareada\":%s,\"tomada\":\"%s\"}",
           WiFi.channel(), espNowOk ? "true" : "false",
           online ? "true" : "false",
           c6UltimoContato == 0 ? -1L : (long)(millis() - c6UltimoContato),
           c6Canal,
           recebe ? "true" : "false",
           (online && c6Pareada) ? "true" : "false",
           online ? tomada : "indefinida");
  server.send(200, "application/json", json);
}

// Aplica no hardware o estado atual de vermelhoOn/laranjaOn/verdeOn.
// Amarelo é sempre o "senão": só acende quando os outros três estão apagados.
void aplicarLeds() {
  digitalWrite(LED_VERMELHO, vermelhoOn ? HIGH : LOW);
  digitalWrite(LED_LARANJA,  laranjaOn  ? HIGH : LOW);
  digitalWrite(LED_VERDE,    verdeOn    ? HIGH : LOW);
  digitalWrite(LED_AMARELO, (!vermelhoOn && !laranjaOn && !verdeOn) ? HIGH : LOW);

  // Buzzer liga com vermelho (risco grave: queda/zona) OU laranja (EPI ausente)
  digitalWrite(BUZZER_PIN, (vermelhoOn || laranjaOn) ? HIGH : LOW);

  atualizarTomada();
}

// Extrai o valor de uma chave string simples de um JSON tipo {"chave":"valor"}
// (parser manual bem básico, feito sob medida pro formato usado neste projeto)
String extrairValorJson(const String& body, const String& chave) {
  String busca = "\"" + chave + "\"";
  int idx = body.indexOf(busca);
  if (idx == -1) return "";

  idx = body.indexOf(':', idx + busca.length());
  if (idx == -1) return "";
  idx++;

  while (idx < (int)body.length() && body[idx] == ' ') idx++; // pula espaços
  if (idx >= (int)body.length() || body[idx] != '"') return ""; // só suporta valor entre aspas
  idx++;

  int fim = body.indexOf('"', idx);
  if (fim == -1) return "";

  return body.substring(idx, fim);
}

// Extrai {"led":"vermelho","state":"on"} do corpo da requisição
bool parseComando(const String& body, String &led, String &state) {
  led = extrairValorJson(body, "led");
  state = extrairValorJson(body, "state");
  return led.length() > 0 && state.length() > 0;
}

// POST /led  com corpo JSON {"led":"vermelho","state":"on"}  (há também GET /status)
// led aceito:   "vermelho", "laranja" ou "verde"   (amarelo não é comandável, é automático)
// state aceito: "on" ou "off"
void handleLed() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"status\":\"erro\",\"msg\":\"corpo vazio\"}");
    return;
  }

  String body = server.arg("plain");
  String led, state;

  if (!parseComando(body, led, state)) {
    server.send(400, "application/json", "{\"status\":\"erro\",\"msg\":\"JSON invalido\"}");
    return;
  }

  if (state != "on" && state != "off") {
    server.send(400, "application/json", "{\"status\":\"erro\",\"msg\":\"state invalido\"}");
    return;
  }

  bool ligar = (state == "on");

  if (led == "vermelho") {
    vermelhoOn = ligar;
    if (ligar) { laranjaOn = false; verdeOn = false; } // mutuamente exclusivos
    Serial.printf("Vermelho -> %s\n", ligar ? "ON" : "OFF");
  } else if (led == "laranja") {
    laranjaOn = ligar;
    if (ligar) { vermelhoOn = false; verdeOn = false; }
    Serial.printf("Laranja -> %s\n", ligar ? "ON" : "OFF");
  } else if (led == "verde") {
    verdeOn = ligar;
    if (ligar) { vermelhoOn = false; laranjaOn = false; }
    Serial.printf("Verde -> %s\n", ligar ? "ON" : "OFF");
  } else {
    server.send(400, "application/json", "{\"status\":\"erro\",\"msg\":\"led invalido (use vermelho, laranja ou verde)\"}");
    return;
  }

  lastUpdate = millis();
  aplicarLeds();

  server.send(200, "application/json", "{\"status\":\"ok\"}");
}

void handleRoot() {
  server.send(200, "text/plain", "ESP32 alerta EPI - online");
}

void handleNotFound() {
  server.send(404, "text/plain", "Not found");
}

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_VERMELHO, OUTPUT);
  pinMode(LED_AMARELO, OUTPUT);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_LARANJA, OUTPUT);

  // Estado inicial: nenhum dos três -> amarelo acende sozinho
  vermelhoOn = false;
  laranjaOn = false;
  verdeOn = false;
  lastUpdate = millis();
  aplicarLeds();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Conectado! IP: ");
  Serial.println(WiFi.localIP());

  iniciarEspNow();

  server.on("/", HTTP_GET, handleRoot);
  server.on("/led", HTTP_POST, handleLed);
  server.on("/status", HTTP_GET, handleStatus);
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println("Servidor HTTP iniciado na porta 80");
}

void loop() {
  server.handleClient();

  // Watchdog: se vermelho, laranja ou verde estiverem ligados e passar tempo
  // demais sem receber comando novo, os três desligam e o amarelo volta sozinho.
  if ((vermelhoOn || laranjaOn || verdeOn) && (millis() - lastUpdate > TIMEOUT_MS)) {
    Serial.println("Timeout: nenhuma atualização recebida - voltando para amarelo");
    vermelhoOn = false;
    laranjaOn = false;
    verdeOn = false;
    aplicarLeds();
    if (DESLIGAR_TOMADA_NO_TIMEOUT) {
      definirTomada(CMD_DESLIGAR);
    }
  }

  // Reenvia o estado atual da tomada de tempos em tempos. Sem estado definido
  // (ainda não houve vermelho/laranja/verde), manda um ping: assim o C6
  // confirma a ligação desde o começo.
  if (millis() - ultimoEnvioTomada > REENVIO_TOMADA_MS) {
    enviarTomada(estadoTomada >= 0 ? estadoTomada : CMD_PING);
  }

  // Avisa no Serial quando o C6 conecta ou desconecta
  bool online = c6Online();
  if (online != c6Conectado) {
    c6Conectado = online;
    if (online) {
      Serial.printf("C6 da tomada conectado (canal %d, tomada %s)\n",
                    c6Canal, c6Pareada ? "pareada" : "NÃO pareada");
    } else {
      Serial.println("C6 da tomada desconectado (sem resposta há 7 s)");
    }
  }
}
