import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) 
    {
        return res.status(401).json({ error: "Token não enviado" });
    }

    const token = authHeader.split(" ")[1];

    try 
    {
        const decoded = jwt.verify(token, SECRET);

        req.user = decoded; 
        return next();
    } 
    catch (err) 
    {
        return res.status(401).json({ error: "Token inválido" });
    }
}