import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmailOrName } from "../repositories/auth.repository.js";
import { AppError } from "../utils/appError.js";
import User from "../models/user.model.js";
import { normalizeBrasiliaTimestamp } from "../utils/convert.js";

const SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

export async function register(data) 
{
    const user = new User(data);

    if (!user.name || !user.email || !user.password) 
    {   
        throw new AppError("Dados inválidos", 400);
    }

    const existingUser = await findUserByEmailOrName(user.email, user.name);

    if (existingUser) 
    {
        throw new AppError("Usuário já existe", 409);
    }

    const hash = await bcrypt.hash(user.password, 10);

    const newUser = 
    {
        name: user.name,
        email: user.email,
        password: hash,
        timestamp: normalizeBrasiliaTimestamp()
    };

    await createUser(newUser);

    return { message: "Usuário criado com sucesso" };
}

export async function login({ email, password }) 
{
    if (!email || !password) 
    {
        throw new AppError("Dados inválidos", 400);
    }

    const dbUser = await findUserByEmailOrName(email, email);

    if (!dbUser) 
    {
        throw new AppError("Usuário não encontrado", 404);
    }

    const valid = await bcrypt.compare(password, dbUser.password);

    if (!valid) 
    {
        throw new AppError("Senha inválida", 401);
    }

    const token = jwt.sign(
        { id: dbUser.id, email: dbUser.email, name: dbUser.name },
        SECRET,
        { expiresIn: "1h" }
    );

    return { token, user: { id: dbUser.id, name: dbUser.name, email: dbUser.email } };
}