import cv2
from ultralytics import YOLO

class ModeloCapacete:
    def __init__(self, model_path="vision/models/best.pt"):
        self.model = YOLO(model_path)

    #Mudar o conf para alterar a sensibilidade da detecção
    def detect(self, frame):
        return self.model(frame, conf=0.5, verbose=False)[0]

    #Bouding Box
    def annotate(self, frame, results):
        return results.plot()