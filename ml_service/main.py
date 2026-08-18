import cv2
import os
import base64
import requests
import threading
import winsound
 
from datetime import datetime
from ml_service.inference.camera import Camera
from ml_service.inference.detector import EPIDetector, IncidentDebouncer
from ml_service.streaming.websocket_server import send_frame, send_alert, send_detections, start_server_in_thread
 
 
ESP_IP = "10.126.104.62"  # atualize aqui se o IP do ESP32 mudar
CLEAR_THRESHOLD = 15       # frames seguidos sem risco para considerar "tudo certo"
 
 
def post_incident(payload):
    try:
        response = requests.post(
            "http://localhost:3000/api/detections",
            json=payload,
            timeout=2
        )
        if response.status_code in (200, 201):
            print(f"✓ Incidente enviado: {payload['label']} ({payload['confidence']})")
        else:
            print(f"✗ Erro na API: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"✗ Falha no POST: {e}")
 
 
def notify_esp_alert():
    print(">> Tentando avisar o ESP (alert)...")
    try:
        r = requests.post(f"http://{ESP_IP}/alert", timeout=2)
        print(f"✓ ESP respondeu (alert): {r.status_code} {r.text}")
    except requests.exceptions.RequestException as e:
        print(f"✗ ESP não respondeu (alert): {e}")
 
 
def notify_esp_clear():
    print(">> Tentando avisar o ESP (clear)...")
    try:
        r = requests.post(f"http://{ESP_IP}/clear", timeout=2)
        print(f"✓ ESP respondeu (clear): {r.status_code} {r.text}")
    except requests.exceptions.RequestException as e:
        print(f"✗ ESP não respondeu (clear): {e}")

def notify_esp_analyzing():
    print(">> Tentando avisar o ESP (analyzing)...")
try:
    r = requests.post(f"http://{ESP_IP}/analyzing", timeout=2)
    print(f"✓ ESP respondeu (analyzing): {r.status_code} {r.text}")
except requests.exceptions.RequestException as e:
    print(f"✗ ESP não respondeu (analyzing): {e}")
 
def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "vision", "models", "best.pt")
 
    try:
        camera = Camera(source=0)
        camera.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        camera.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        detector = EPIDetector(model_path=model_path)
        debouncer = IncidentDebouncer(required_frames=10, cooldown_frames=60)
    except RuntimeError as e:
        print(f"Erro ao inicializar: {e}")
        return
    except Exception as e:
        print(f"Erro ao carregar modelo em {model_path}: {e}")
        return
 
    start_server_in_thread()
 
    print("--- Sistema ativo: Pressione 'ESC' para sair ---")
 
    # Estado do alerta físico (ESP32). O ESP32 agora começa DESLIGADO ao ligar,
    # então is_cleared=True reflete corretamente esse estado inicial.
    clear_streak = 0
    is_cleared = True
    light_state = "yellow"
 
    try:
        while camera.is_opened():
            ret, frame = camera.read()
            if not ret:
                print("Falha na captura do frame.")
                break
 
            results = detector.model(frame, conf=detector.conf, verbose=False)
            result  = results[0]
 
            detections = detector.run(frame)
            incidents  = detector.incidents(detections)
            confirmed  = debouncer.update(incidents)
 
            if incidents:
                for i in incidents:
                    print(f"Incidente: {i.label} ({i.confidence:.2f})")
 
            # ---- Lógica dos 3 estados do LED / buzzer ----
            if incidents:
                clear_streak = 0
                if light_state != "red":
                    threading.Thread(target=notify_esp_alert, daemon=True).start()
                    light_state = "red"
                    is_cleared = False
            else:
                clear_streak += 1

                if light_state == "red" and clear_streak == 1:
                    threading.Thread(target=notify_esp_analyzing, daemon=True).start()
                    light_state = "yellow"

                if clear_streak == CLEAR_THRESHOLD and light_state != "green":
                    threading.Thread(target=notify_esp_clear, daemon=True).start()
                    light_state = "green"
                    is_cleared = True

            # --------------------------------------------------------------------------------------------
 
            annotated_frame = result.plot()
 
            send_frame(annotated_frame)
 
            # Envia detecções a cada frame (fora do for de confirmados)
            send_detections([
                {"label": d.label, "confidence": round(float(d.confidence), 4)}
                for d in detections
            ])
 
            for detection in confirmed:
                timestamp = datetime.now()
                _, buffer = cv2.imencode('.jpg', frame)
                img_frame_b64 = base64.b64encode(buffer).decode('utf-8')
 
                winsound.Beep(1000, 300)
 
                send_alert(
                    label=detection.label,
                    confidence=round(float(detection.confidence), 4),
                    timestamp=timestamp.isoformat(),
                )
 
                payload = {
                    "timestamp": timestamp.isoformat(),
                    "label": detection.label,
                    "confidence": round(float(detection.confidence), 4),
                    "img_Frame": img_frame_b64
                }
 
                threading.Thread(
                    target=post_incident,
                    args=(payload,),
                    daemon=True
                ).start()
 
            if cv2.waitKey(1) & 0xFF == 27:
                break
 
    finally:
        camera.release()
        cv2.destroyAllWindows()
        print("Recursos liberados.")
 
 
if __name__ == "__main__":
    main()