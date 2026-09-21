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

Configuração ausente e lista vazia significam "nenhum EPI ativo".
"""

import json
import os
import threading
import unicodedata
from flask import Flask, request, jsonify
from flask_cors import CORS

CONFIG_FILE        = os.path.join(os.path.dirname(__file__), "zona_config.json")
ANALISE_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "analise_config.json")

# ── Config de análise per-setor (lida diretamente pelo main.py via import) ─────
_DEFAULT_ANALISE = {"epis": [], "ergonomia": True}

def _load_analise_config() -> dict:
    try:
        with open(ANALISE_CONFIG_FILE, encoding="utf-8") as f:
            data = json.load(f)
        # Migração: formato antigo era {"epis": [...], "ergonomia": bool}
        if "epis" in data or "ergonomia" in data:
            return {"": data}
        return data
    except Exception:
        return {}

# dict: setor (str) → {"epis": [...], "ergonomia": bool}
# chave "" (vazia) é o fallback global (retrocompatibilidade)
_analise_config_por_setor: dict[str, dict] = _load_analise_config()

def _analysis_key(setor: str = "", camera_id=None) -> str:
    return f"camera:{camera_id}" if camera_id is not None and str(camera_id) != "" else setor


def get_analise_config(setor: str = "", camera_id=None) -> dict:
    camera_key = _analysis_key(setor, camera_id)
    if camera_key in _analise_config_por_setor:
        return _analise_config_por_setor[camera_key].copy()
    if setor in _analise_config_por_setor:
        return _analise_config_por_setor[setor].copy()
    if "" in _analise_config_por_setor:
        return _analise_config_por_setor[""].copy()
    return _DEFAULT_ANALISE.copy()

# Prefixos dos labels do modelo EPI para cada chave do frontend
EPI_KEY_TO_PREFIX = {
    "auricular": "AURICULAR",
    "botas":     "BOTAS",
    "capacete":  "CAPACETE",
    "colete":    "COLETE",
    "mascara":   "MASCARA",
    "oculos":    "OCULOS",
}

EPI_ALIASES = {
    "1": "capacete", "2": "oculos", "3": "colete", "4": "mascara",
    "auricular": "auricular", "botas": "botas", "capacete": "capacete",
    "colete": "colete", "mascara": "mascara", "oculos": "oculos",
}


def _normalize_epi_key(value) -> str | None:
    if isinstance(value, dict):
        value = value.get("key", value.get("nome", value.get("name", value.get("id"))))
    if value is None:
        return None
    normalized = "".join(
        char for char in unicodedata.normalize("NFD", str(value).strip().lower())
        if unicodedata.category(char) != "Mn"
    )
    return EPI_ALIASES.get(normalized)


def normalize_epis(epis) -> list[str]:
    if not isinstance(epis, list):
        raise ValueError("epis deve ser uma lista")
    normalized = []
    invalid = []
    for item in epis:
        key = _normalize_epi_key(item)
        if key is None:
            invalid.append(str(item))
        elif key not in normalized:
            normalized.append(key)
    if invalid:
        raise ValueError(f"EPIs inválidos: {', '.join(invalid)}")
    return normalized

def epi_prefixes_ativos(setor: str = "", camera_id=None) -> list[str] | None:
    """Retorna lista de prefixos ativos para o setor.
    None  → detecta todos os EPIs.
    [...]  → apenas esses prefixos.
    """
    cfg = get_analise_config(setor, camera_id)
    epis = cfg.get("epis")
    if epis is None:
        return []
    prefixes = [EPI_KEY_TO_PREFIX[k.lower()] for k in epis if k.lower() in EPI_KEY_TO_PREFIX]
    return prefixes


def set_analise_config(setor: str, epis: list[str], camera_id=None, ergonomia=None) -> dict:
    normalized_epis = normalize_epis(epis)
    key = _analysis_key(setor, camera_id)
    previous = get_analise_config(setor, camera_id)
    cfg = {"epis": normalized_epis, "ergonomia": previous.get("ergonomia", True)}
    if ergonomia is not None:
        cfg["ergonomia"] = bool(ergonomia)
    _analise_config_por_setor[key] = cfg
    with open(ANALISE_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(_analise_config_por_setor, f, ensure_ascii=False, indent=2)
    return cfg.copy()

def ergonomia_ativa(setor: str = "") -> bool:
    cfg = _analise_config_por_setor.get(setor, _DEFAULT_ANALISE)
    return bool(cfg.get("ergonomia", True))


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
        setor = request.args.get("setor", "")
        camera_id = request.args.get("camera_id")
        return jsonify(get_analise_config(setor, camera_id))

    @app.route("/config/analise", methods=["POST"])
    def set_analise():
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"erro": "body JSON obrigatório"}), 400
        setor = data.get("setor", "")
        try:
            cfg = set_analise_config(
                setor, data.get("epis", []), data.get("camera_id"), data.get("ergonomia")
            )
        except (ValueError, OSError) as e:
            return jsonify({"erro": str(e)}), 400
        print(f"[CONFIG] Análise setor='{setor}': epis={cfg['epis']} ergonomia={cfg['ergonomia']}")
        return jsonify({"ok": True, "setor": setor, **cfg})

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
