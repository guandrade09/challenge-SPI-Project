import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from zone_checker import ZoneChecker, decode_frame

app = Flask(__name__)
CORS(app)

_checker = ZoneChecker("yolov8n-pose.pt")


@app.route("/zona/status", methods=["GET"])
def status():
    return jsonify({"status": "ok", "modelo": _checker.model_name})


@app.route("/zona/configurar", methods=["POST"])
def configurar():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"erro": "body JSON obrigatorio"}), 400
    for campo in ("camera_id", "nome", "pontos"):
        if campo not in data:
            return jsonify({"erro": f"campo '{campo}' obrigatorio"}), 400
    pontos = data["pontos"]
    if not isinstance(pontos, list) or len(pontos) < 3:
        return jsonify({"erro": "'pontos' deve ser lista com ao menos 3 pontos"}), 400
    try:
        _checker.configure(data["camera_id"], data["nome"], pontos)
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
    return jsonify({"ok": True, "camera_id": data["camera_id"]})


@app.route("/zona/configurar/<camera_id>", methods=["GET"])
def get_zona(camera_id):
    zone = _checker.get(camera_id)
    if zone is None:
        return jsonify({"erro": f"camera '{camera_id}' nao configurada"}), 404
    return jsonify(zone)


@app.route("/zona/configurar/<camera_id>", methods=["DELETE"])
def delete_zona(camera_id):
    if not _checker.delete(camera_id):
        return jsonify({"erro": f"camera '{camera_id}' nao encontrada"}), 404
    return jsonify({"ok": True, "camera_id": camera_id})


@app.route("/zona/verificar", methods=["POST"])
def verificar():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"erro": "body JSON obrigatorio"}), 400
    for campo in ("camera_id", "frame"):
        if campo not in data:
            return jsonify({"erro": f"campo '{campo}' obrigatorio"}), 400
    try:
        frame = decode_frame(data["frame"])
    except ValueError as e:
        return jsonify({"erro": f"frame invalido: {e}"}), 400
    t0 = time.perf_counter()
    try:
        nome_zona, pessoas = _checker.check(data["camera_id"], frame)
    except KeyError as e:
        return jsonify({"erro": str(e)}), 404
    except Exception as e:
        return jsonify({"erro": f"erro na verificacao: {e}"}), 500
    latencia_ms = round((time.perf_counter() - t0) * 1000, 1)
    return jsonify({
        "camera_id": data["camera_id"],
        "zona": nome_zona,
        "pessoas": pessoas,
        "alerta": any(p["invadiu"] for p in pessoas),
        "latencia_ms": latencia_ms,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=False)
