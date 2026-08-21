"""
Servidor de configuração do orquestrador (zona de risco + análise de EPIs/ergonomia).
Roda em thread separada (porta 5050).

Endpoints de zona:
  POST   /zona/configurar  — define ou atualiza a zona
  GET    /zona/status      — retorna zona atual
  DELETE /zona/configurar  — remove a zona

Endpoints de análise:
  POST   /config/analise   — { "epis": ["capacete","colete"], "ergonomia": true }
  GET    /config/analise   — retorna config atual

epis = [] significa "todos ativos" (padrão/backward compat).
"""

import json
import os
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS

CONFIG_FILE        = os.path.join(os.path.dirname(__file__), "zona_config.json")
ANALISE_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "analise_config.json")

# ── Config de análise (lida diretamente pelo main.py via import) ───────────────
def _load_analise_config() -> dict:
    try:
        with open(ANALISE_CONFIG_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"epis": [], "ergonomia": True}

_analise_config = _load_analise_config()

def get_analise_config() -> dict:
    return _analise_config.copy()

# Prefixos dos labels do modelo EPI para cada chave do frontend
EPI_KEY_TO_PREFIX = {
    "auricular": "AURICULAR",
    "botas":     "BOTAS",
    "capacete":  "CAPACETE",
    "colete":    "COLETE",
    "mascara":   "MASCARA",
    "oculos":    "OCULOS",
}

def epi_prefixes_ativos() -> list[str] | None:
    """Retorna lista de prefixos ativos, ou None se todos estiverem ativos."""
    epis = _analise_config.get("epis", [])
    if not epis:
        return None  # todos ativos
    return [EPI_KEY_TO_PREFIX[k] for k in epis if k in EPI_KEY_TO_PREFIX]

def ergonomia_ativa() -> bool:
    return bool(_analise_config.get("ergonomia", True))


# ── Persistência local ─────────────────────────────────────────────────────────

def save_config(config: dict) -> None:
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def delete_config() -> None:
    if os.path.exists(CONFIG_FILE):
        os.remove(CONFIG_FILE)


def load_config() -> dict | None:
    """Lê zona_config.json; retorna None se não existir ou estiver corrompido."""
    if not os.path.exists(CONFIG_FILE):
        return None
    try:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


# ── Flask app ──────────────────────────────────────────────────────────────────

def _build_app(zone_checker, camera_id: str) -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.route("/zona/status", methods=["GET"])
    def status():
        zone = zone_checker.get(camera_id)
        if zone is None:
            return jsonify({"configurada": False, "camera_id": camera_id})
        return jsonify({"configurada": True, "camera_id": camera_id, **zone})

    @app.route("/zona/configurar", methods=["POST"])
    def configurar():
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"erro": "body JSON obrigatório"}), 400

        nome   = data.get("nome", "Área restrita")
        pontos = data.get("pontos")
        cam_id = data.get("camera_id", camera_id)

        if not isinstance(pontos, list) or len(pontos) < 3:
            return jsonify({"erro": "'pontos' deve ser lista com ao menos 3 pontos"}), 400

        try:
            zone_checker.configure(cam_id, nome, pontos)
        except ValueError as e:
            return jsonify({"erro": str(e)}), 400

        save_config({"camera_id": cam_id, "nome": nome, "pontos": pontos})
        print(f"[ZONA] Atualizada: '{nome}' — {len(pontos)} pontos")
        return jsonify({"ok": True, "camera_id": cam_id, "nome": nome})

    @app.route("/zona/configurar", methods=["DELETE"])
    def remover():
        removed = zone_checker.delete(camera_id)
        if removed:
            delete_config()
            print("[ZONA] Removida")
        return jsonify({"ok": removed, "camera_id": camera_id})

    @app.route("/config/analise", methods=["GET"])
    def get_analise():
        return jsonify(_analise_config)

    @app.route("/config/analise", methods=["POST"])
    def set_analise():
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"erro": "body JSON obrigatório"}), 400
        if "epis" in data:
            _analise_config["epis"] = [k for k in data["epis"] if k in EPI_KEY_TO_PREFIX]
        if "ergonomia" in data:
            _analise_config["ergonomia"] = bool(data["ergonomia"])
        try:
            with open(ANALISE_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(_analise_config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[CONFIG] Aviso: não foi possível salvar analise_config.json: {e}")
        print(f"[CONFIG] Análise: epis={_analise_config['epis']} ergonomia={_analise_config['ergonomia']}")
        return jsonify({"ok": True, **_analise_config})

    return app


def start(zone_checker, camera_id: str, port: int = 5050) -> None:
    """Inicia o servidor de configuração em daemon thread."""
    app = _build_app(zone_checker, camera_id)

    t = threading.Thread(
        target=lambda: app.run(
            host="0.0.0.0", port=port,
            debug=False, use_reloader=False,
        ),
        daemon=True,
        name="config-server",
    )
    t.start()
    print(f"[CONFIG] Zona configurável em http://localhost:{port}/zona/configurar")
