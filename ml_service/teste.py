from roboflow import Roboflow

rf = Roboflow(api_key="GvkijPJsitqTVsBp6bkX")
project = rf.workspace().project("deteccao-epi-spi-challenge")
version = project.version(7)

# Baixa o modelo treinado
version.download("yolov11")