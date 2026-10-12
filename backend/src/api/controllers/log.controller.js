import * as logService from "../services/log.service.js";
import { ErrorHandler } from "../utils/appError.js";

export async function listLogs(req, res) {
  try {
    const logs = await logService.readLogs();
    return res.status(200).json({ count: logs.length, data: logs });
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}

export async function removeLog(req, res) {
  try {
    return res.status(200).json(await logService.deleteLog(req.params.id));
  } catch (error) {
    return ErrorHandler.handle(res, error);
  }
}
