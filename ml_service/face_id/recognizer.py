import os
import cv2
import numpy as np

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DETECTOR_MODEL_PATH = os.path.join(_BASE_DIR, "models", "face_detection_yunet_2023mar.onnx")
RECOGNIZER_MODEL_PATH = os.path.join(_BASE_DIR, "models", "face_recognition_sface_2021dec.onnx")

# Limiar de similaridade de cosseno recomendado pelo modelo SFace (OpenCV Zoo).
# Acima disso, duas faces são consideradas a mesma pessoa.
COSINE_MATCH_THRESHOLD = 0.363


class FaceRecognizer:
    """Detecção (YuNet) + reconhecimento facial (SFace), ambos embutidos no OpenCV >= 4.5.4."""

    def __init__(self, detector_model_path=DETECTOR_MODEL_PATH, recognizer_model_path=RECOGNIZER_MODEL_PATH,
                 score_threshold: float = 0.9):
        for path in (detector_model_path, recognizer_model_path):
            if not os.path.exists(path):
                raise RuntimeError(f"Modelo não encontrado: {path}")

        # OpenCV lê arquivos ONNX via caminho com fopen() em C++, que não lida bem
        # com caracteres acentuados em caminhos no Windows. Contornamos isso lendo
        # os bytes do modelo em Python (que lida com Unicode corretamente) e
        # passando via buffer, em vez do caminho direto.
        with open(detector_model_path, "rb") as f:
            detector_buffer = f.read()
        with open(recognizer_model_path, "rb") as f:
            recognizer_buffer = f.read()

        self.detector = cv2.FaceDetectorYN.create(
            "onnx", detector_buffer, b"", (320, 320), score_threshold=score_threshold
        )
        self.recognizer = cv2.FaceRecognizerSF.create("onnx", recognizer_buffer, b"")

    def detect(self, frame) -> np.ndarray | None:
        """Retorna um array Nx15 (bbox 4 + 5 landmarks*2 + score) ou None se nada for detectado."""
        h, w = frame.shape[:2]
        self.detector.setInputSize((w, h))
        _, faces = self.detector.detect(frame)
        return faces

    def embed(self, frame, face_row: np.ndarray) -> np.ndarray:
        """Alinha o rosto detectado e gera o embedding (vetor 1x128)."""
        aligned = self.recognizer.alignCrop(frame, face_row)
        return self.recognizer.feature(aligned)

    def compare(self, embedding_a: np.ndarray, embedding_b: np.ndarray) -> float:
        """Similaridade de cosseno entre dois embeddings. Quanto maior, mais parecido."""
        return self.recognizer.match(embedding_a, embedding_b, cv2.FaceRecognizerSF_FR_COSINE)

    def best_match(self, embedding: np.ndarray, database: "FaceDatabase"):
        """Compara um embedding com todas as pessoas cadastradas.

        Retorna (nome, score) da melhor correspondência, ou (None, melhor_score) se
        ninguém no banco ultrapassar o limiar de reconhecimento.
        """
        best_name, best_score = None, -1.0
        for name, known_embedding in database.all_embeddings():
            score = self.compare(embedding, known_embedding)
            if score > best_score:
                best_name, best_score = name, score

        if best_score >= COSINE_MATCH_THRESHOLD:
            return best_name, best_score
        return None, best_score
