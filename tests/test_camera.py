import cv2

from camera import Camera

def main():
    camera = Camera(0)

    if not camera.is_opened():
        print("Não conseguiu abrir camera")
        return
    
    print("Camera aberta")

    while True:
        ret, frame = camera.read()
        
        if not ret:
            print("falha ao ler frame")
            break

        cv2.imshow("Camera Test", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    camera.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()


