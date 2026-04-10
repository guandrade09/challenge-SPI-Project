import os
from datetime import datetime
from dataclasses import dataclass


RISK_LABELS = [
    "Sem Capacete",
    "Sem Colete",
    "Sem Oculos",
]

@dataclass
class Detection:
    label: str
    confidence: float
    x1: int
    y1: int
    x2: int
    y2: int
    
       
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

@dataclass
class IncidentEntry:
    label: str
    confidence: float
    timestamp: datetime
    img_path: str
        
    @property
    def img_name(self):
        return os.path.basename(self.img_path)
    
    @property
    def time_short(self):
        return self.timestamp.strftime("%H:%M:%S")
