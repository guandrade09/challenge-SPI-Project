import sys

from ultralytics import YOLO


def main():
    pt_path = sys.argv[1]
    imgsz = int(sys.argv[2])
    half = sys.argv[3] == "1"
    workspace_arg = sys.argv[4] if len(sys.argv) > 4 else ""
    workspace = float(workspace_arg) if workspace_arg else None

    kwargs = dict(format="engine", half=half, imgsz=imgsz)
    if workspace is not None:
        kwargs["workspace"] = workspace

    model = YOLO(pt_path)
    exported_path = model.export(**kwargs)
    print(f"EXPORTED:{exported_path}")


if __name__ == "__main__":
    main()
