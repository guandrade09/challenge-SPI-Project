import cv2

class Camera:
    def __init__(self, source = 0):
        self.cap = cv2.VideoCapture(source)

    def read(self):
        return self.cap.read()        

    def release(self):
        self.cap.release()

    def is_opened(self) -> bool:
        return self.cap.isOpened()