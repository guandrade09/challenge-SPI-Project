import * as threadService from "../services/thread.service.js";
import { ErrorHandler } from "../utils/appError.js";

export async function register(req, res) {
    try {
        if (!req.body) {
            return res.status(400).json({ error: "Body não enviado" });
        }

        const result = await threadService.register(req.body);
        return res.status(201).json(result);
    } catch (error) {
        return ErrorHandler.handle(res, error);
    }
}

export async function listThreads(req, res) {
    try {
        const data = await threadService.listThreadsConsume();
        return res.status(200).json({ count: data.length, data });
    } catch (error) {
        return ErrorHandler.handle(res, error);
    }
}

export async function getByThreadName(req, res) {
    try {
        const { thread_name } = req.params;
        if (!thread_name) {
            return res.status(400).json({ error: "Nome da thread é obrigatório" });
        }

        const data = await threadService.getThreadsConsumeByThreadName(thread_name);
        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Nenhuma thread encontrada" });
        }

        return res.status(200).json(data);
    } catch (error) {
        return ErrorHandler.handle(res, error);
    }
}

export async function getByTimestamp(req, res) {
    try {
        const { timestamp } = req.params;
        if (!timestamp) {
            return res.status(400).json({ error: "Timestamp é obrigatório" });
        }

        const data = await threadService.getThreadsConsumeByTimeStamp(timestamp);
        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Nenhuma thread encontrada" });
        }

        return res.status(200).json(data);
    } catch (error) {
        return ErrorHandler.handle(res, error);
    }
}
