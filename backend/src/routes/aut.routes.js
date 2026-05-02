import { Router } from "express";
import { create,login} from "../controllers/auth.controller.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";

const router = Router();

router.post("/user/login",authMiddleware, create);
router.get("/user/register", authMiddleware, login);

export default router;