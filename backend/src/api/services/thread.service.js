import {
    saveThreadsConsume,
    getThreadsConsume as repoGetThreadsConsume,
    getThreadsConsumeByThreadName as repoGetThreadsConsumeByThreadName,
    getThreadsConsumeByTimeStamp as repoGetThreadsConsumeByTimeStamp,
} from "../repositories/thread.repository.js";
import { AppError } from "../utils/appError.js";
import threadsConsume from "../models/thread.model.js";
import { normalizeBrasiliaTimestamp, formatBrasiliaTimestamp } from "../utils/convert.js";
import logMonitorService from "../../services/log-monitor.service.js";

function normalizeToBrasilia(timestamp) {
    return normalizeBrasiliaTimestamp(timestamp);
}

export async function register(data) {
    if (!data) {
        throw new AppError("Dados inválidos", 400);
    }

    if (data.metrics && Array.isArray(data.metrics)) {
        return await registerBatch(data);
    }

    const timestamp = normalizeToBrasilia(data.timestamp);
    const Consume = new threadsConsume({ ...data, timestamp });

    if (!Consume.thread_name || Consume.quantity_of_cpu_ind_percentage === undefined || Consume.quantity_of_cpu_ind_percentage === null) {
        throw new AppError("Dados inválidos", 400);
    }

    await saveThreadsConsume(Consume);

    await logMonitorService.appendEntry({
        timestamp: normalizeToBrasilia(data.timestamp),
        line: "metrica de threads salvas",
    });

    return { message: "Thread cadastrada com sucesso" };
}

export async function registerBatch({ thread_name, metrics }) {
    if (!thread_name || !Array.isArray(metrics) || metrics.length === 0) {
        throw new AppError("Dados inválidos para batch", 400);
    }

    const normalizedMetrics = metrics.map((metric) => ({
        ...metric,
        timestamp: normalizeToBrasilia(metric.timestamp),
    }));

    const totalProcessLoaded = normalizedMetrics.reduce(
        (sum, metric) => sum + (Number(metric.process_loaded) || 0),
        0
    );

    const avgCpuLoad =
        normalizedMetrics.reduce(
            (sum, metric) => sum + (Number(metric.quantity_of_cpu_ind_percentage) || 0),
            0
        ) / normalizedMetrics.length;

    const latestTimestamp = normalizedMetrics[normalizedMetrics.length - 1]?.timestamp || formatBrasiliaTimestamp();

    const Consume = new threadsConsume({
        thread_name,
        timestamp: latestTimestamp,
        quantity_of_cpu_ind_percentage: Math.round(avgCpuLoad * 100) / 100,
        process_loaded: totalProcessLoaded,
    });

    if (!Consume.thread_name || Consume.quantity_of_cpu_ind_percentage === undefined || Consume.quantity_of_cpu_ind_percentage === null) {
        throw new AppError("Dados inválidos no batch de threads", 400);
    }

    await saveThreadsConsume(Consume);

    await logMonitorService.appendEntry({
        timestamp: latestTimestamp,
        line: "metrica de threads salvas",
    });

    return { message: "Batch de threads cadastrado com sucesso", count: metrics.length };
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