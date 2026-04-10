class Detection:
    def __init__(self, label, confidence, x1, y1, x2, y2):
        self.label = label
        self.confidence = confidence
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2




class IncidentEntry:
    def __init__(self, label, confidence, timestemp):
        self.label = label
        self.confidence = confidence
        self.timestemp = timestemp 