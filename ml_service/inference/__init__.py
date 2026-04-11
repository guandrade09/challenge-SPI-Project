def __init__(self, source=0):
    self.cap = cv2.VideoCapture(source)

    if not self.is_opened():
        raise RuntimeError(f"Não foi possivel abrir a camera {source}")

                           
