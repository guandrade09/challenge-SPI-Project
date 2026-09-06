import { Router } from "express";
import { createCamera, listCameras, getCamera, updateCameraById, deleteCameraById } from "../controllers/camera.controller.js";

const router = Router();

router.post("/cameras", createCamera);
router.get("/cameras", listCameras);
router.get("/cameras/:id", getCamera);
router.put("/cameras/:id", updateCameraById);
router.delete("/cameras/:id", deleteCameraById);

export default router;