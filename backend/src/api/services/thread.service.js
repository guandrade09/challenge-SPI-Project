import {
    saveThreadsConsume,
    getThreadsConsume as repoGetThreadsConsume,
    getThreadsConsumeByThreadName as repoGetThreadsConsumeByThreadName,
    getThreadsConsumeByTimeStamp as repoGetThreadsConsumeByTimeStamp,
} from "../repositories/thread.repository.js";
import { AppError } from "../utils/appError.js";
import threadsConsume from "../models/thread.model.js";

export async function register(data) {
    const Consume = new threadsConsume(data);

    if (!Consume.thread_name || Consume.quantity_of_cpu_ind_percentage === undefined || Consume.quantity_of_cpu_ind_percentage === null) {
        throw new AppError("Dados inválidos", 400);
    }

    await saveThreadsConsume(Consume);

    return { message: "Thread cadastrada com sucesso" };
}

export async function listThreadsConsume() {
    return await repoGetThreadsConsume();
}

export async function getThreadsConsumeByThreadName(thread_name) {
    return await repoGetThreadsConsumeByThreadName(thread_name);
}

export async function getThreadsConsumeByTimeStamp(timestamp) {
    return await repoGetThreadsConsumeByTimeStamp(timestamp);
}