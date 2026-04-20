import os
from datetime import datetime
from dataclasses import dataclass


RISK_LABELS = [
    "sem_capacete",
    "sem_colete",
    "sem_oculos",
]

@dataclass
class Detection:
    label: str
    confidence: float
    x1: float
    y1: float
    x2: float
    y2: float
    
       
    @property
    def center_x(self) -> float:
        return (self.x1 + self.x2) / 2

    @property
    def center_y(self) -> float:
        return (self.y1 + self.y2) / 2
    
    @property
    def width(self) -> float:
        return (self.x2 - self.x1)
    
    @property
    def height(self) -> float:
        return (self.y2 - self.y1)
    
    @property
    def is_risk(self) -> bool:
        return self.label in RISK_LABELS

@dataclass
class IncidentEntry:
    label: str
    confidence: float
    timestamp: datetime
    img_path: str
        
    @property
    def img_name(self) -> str:
        return os.path.basename(self.img_path)
    
    @property
    def time_short(self) -> str:
        return self.timestamp.strftime("%H:%M:%S")
