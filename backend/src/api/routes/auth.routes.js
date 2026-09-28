import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";

const router = Router();

router.post("/user/register", register);
router.post("/user/login", login);

export default router;