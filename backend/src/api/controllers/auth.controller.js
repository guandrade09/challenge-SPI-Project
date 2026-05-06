import { register as registerUser, login as loginUser } from "../services/auth.service.js";
import { ErrorHandler } from "../utils/appError.js";

export async function register(req, res) 
{
    try 
    {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
            error: "Nome, email e senha são obrigatórios",
            });
        }

        const user = await registerUser(req.body);

        return res.status(201).json({
            message: "Usuário criado com sucesso",
            data: user,
        });
    } 
    catch (error) 
    {
        return ErrorHandler.handle(res, error);
    }
}

export async function login(req, res) 
{
    try 
    {
        const { email, password } = req.body;

        if (!email || !password) {
                return res.status(400).json({
                error: "Email e senha são obrigatórios",
            });
    }

    const token = await loginUser({ email, password });

    return res.status(200).json({
            message: "Login realizado com sucesso",
            token,
        });
    } 
    catch (error) 
    {
        return ErrorHandler.handle(res, error);
    }
}