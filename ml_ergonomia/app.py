import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from pose_analyzer import PoseAnalyzer, decode_frame

app = Flask(__name__)
CORS(app)

_analyzer = PoseAnalyzer("yolov8n-pose.pt")


@app.route("/ergonomia/status", methods=["GET"])
def status():
    return jsonify({"status": "ok", "modelo": _analyzer.model_name})


@app.route("/ergonomia/analisar", methods=["POST"])
def analisar():
    data = request.get_json(silent=True)
    if not data or "frame" not in data:
        return jsonify({"erro": "campo 'frame' obrigatório"}), 400

    try:
        frame = decode_frame(data["frame"])
    except ValueError as e:
        return jsonify({"erro": f"frame inválido: {e}"}), 400

    t0 = time.perf_counter()
    try:
        pessoas = _analyzer.analyze(frame)
    except Exception as e:
        return jsonify({"erro": f"erro na análise: {e}"}), 500
    latencia_ms = round((time.perf_counter() - t0) * 1000, 1)

    total_em_risco = sum(1 for p in pessoas if p["classe"] != "adequada")

    return jsonify({
        "pessoas": pessoas,
        "total_em_risco": total_em_risco,
        "latencia_ms": latencia_ms,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
