import os
import subprocess
import sys

from ultralytics import YOLO

_EXPORT_SCRIPT = os.path.join(os.path.dirname(__file__), "export_engine.py")
_EXPORT_TIMEOUT_S = 1200  # primeira compilação pode ser lenta


def load_yolo_with_engine_fallback(
    pt_path: str, imgsz: int = 320, half: bool = True, workspace: float | None = 1.0
) -> YOLO:
    """Carrega um modelo YOLO, preferindo um .engine (TensorRT) já compilado pra essa
    GPU/driver — é bem mais rápido que o .pt em CUDA. Um .engine só roda na mesma
    combinação de GPU+driver+versão do TensorRT que o gerou, então:

    1. Se já existe um .engine ao lado do .pt, tenta carregar ele.
    2. Se não existe (ou falhou ao carregar — ex: GPU trocada), tenta compilar um novo
       a partir do .pt, num processo separado (ver `export_engine.py`). Isso baixa
       dependências (tensorrt/onnx) na primeira vez e pode levar alguns minutos.
    3. Se a compilação falhar por qualquer motivo (sem CUDA, driver incompatível,
       dependência faltando, ou até um crash nativo do builder — já visto em GPUs
       com pouca VRAM), cai pro .pt puro — o pipeline nunca fica sem rodar por causa
       do TensorRT. O export roda isolado num subprocesso justamente porque esse
       crash nativo (ex: "LLVM ERROR: out of memory" do NVRTC/ptxas) não é uma
       exceção Python — um try/except no processo principal não pegaria, e o
       orquestrador inteiro morreria junto.
    4. Se uma tentativa de compilação já falhou antes, marca com um arquivo
       `<modelo>.engine.failed` ao lado do .pt pra não gastar minutos retentando a
       cada restart — apaga esse arquivo pra forçar uma nova tentativa.

    O .engine é compilado para um imgsz fixo (mais rápido que dynamic=True); por isso
    todo lugar que chama esse modelo precisa usar o mesmo imgsz usado aqui no export.
    """
    engine_path = os.path.splitext(pt_path)[0] + ".engine"
    failed_marker = engine_path + ".failed"

    if os.path.exists(engine_path):
        try:
            model = YOLO(engine_path)
            print(f"[MODEL] Engine TensorRT carregado: {engine_path}")
            return model
        except Exception as e:
            print(f"[MODEL] Falha ao carregar engine existente {engine_path} ({e}) — tentando recompilar.")

    if os.path.exists(failed_marker):
        print(f"[MODEL] Export TensorRT já falhou antes para {pt_path} "
              f"(apague {failed_marker} para tentar de novo) — usando .pt.")
        return YOLO(pt_path)

    try:
        import torch
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA indisponível nessa máquina")

        print(f"[MODEL] Compilando TensorRT a partir de {pt_path} (imgsz={imgsz}, half={half})... "
              f"processo isolado, primeira vez pode levar alguns minutos.")
        result = subprocess.run(
            [
                sys.executable, _EXPORT_SCRIPT, pt_path, str(imgsz),
                "1" if half else "0", str(workspace) if workspace is not None else "",
            ],
            timeout=_EXPORT_TIMEOUT_S,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0 or not os.path.exists(engine_path):
            tail = (result.stderr or result.stdout or "").strip()[-500:]
            raise RuntimeError(f"processo de export saiu com código {result.returncode}: {tail}")

        model = YOLO(engine_path)
        print(f"[MODEL] Engine TensorRT gerado e carregado: {engine_path}")
        return model
    except Exception as e:
        try:
            with open(failed_marker, "w") as f:
                f.write(str(e))
        except OSError:
            pass
        print(f"[MODEL] TensorRT indisponível ({e}) — usando {pt_path} sem aceleração extra (fallback).")
        return YOLO(pt_path)
