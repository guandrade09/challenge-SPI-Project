import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/secrets.js";

export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Token não enviado" });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Formato de token inválido" });
    }

    try 
    {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded; 
        return next();
    } 
    catch (err) 
    {
        return res.status(401).json({ error: "Token inválido" });
    }
}