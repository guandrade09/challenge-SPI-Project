import os
from datetime import datetime

RISK_LABELS = [
    "Sem Capacete",
    "Sem Colete",
    "Sem Oculos",
]


class Detection:
    def __init__(self, label, confidence, x1, y1, x2, y2):
        self.label = label
        self.confidence = confidence
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
        
    @property
    def center_x(self):
        return (self.x1 + self.x2) / 2

    @property
    def center_y(self):
        return (self.y1 + self.y2) / 2
    
    @property
    def width(self):
        return (self.x2 - self.x1)
    
    @property
    def height(self):
        return (self.y2 - self.y1)
    
    @property
    def is_risk(self):
        return self.label in RISK_LABELS


class IncidentEntry:
    def __init__(self, label, confidence, timestamp, img_path):
        self.label = label
        self.confidence = confidence
        self.timestamp = timestamp
        self.img_path = img_path
    
    @property
    def img_name(self):
        return os.path.basename(self.img_path)
    
    @property
    def time_short(self):
        return self.timestamp.strftime("%H:%M:%S")
