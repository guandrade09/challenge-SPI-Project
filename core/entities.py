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
        return self.label.startswith("Sem")


d1 = Detection("Sem Capacete", 0.92, 0, 0, 100, 100)
d2 = Detection("Com Capacete", 0.88, 0, 0, 100, 100)

print(d1.is_risk)   # True
print(d2.is_risk)   # False




class IncidentEntry:
    def __init__(self, label, confidence, timestamp, img_path):
        self.label = label
        self.confidence = confidence
        self.timestamp = timestamp
        self.img_path = img_path


