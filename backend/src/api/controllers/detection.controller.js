import {
  createDetection,
  viewDetection,
  searchDetection,
  searchDetectionByDay
} from "../services/detection.service.js";

import { ErrorHandler } from "../utils/appError.js";

export async function create(req, res) 
{
  try 
  {
    if (!req.body) 
    {
      return res.status(400).json({ error: "Body não enviado" });
    }

  const detections = await createDetection(req.body);

  return res.status(201).json({
      message: `${detections.length} detection(s) criada(s) com sucesso`,
      data: detections,
    });
  } 
  catch (error) 
  {
    return ErrorHandler.handle(res, error);
  }
}

export async function list(req, res) 
{
  try 
  {
    const data = await viewDetection();

    return res.status(200).json({
      count: data.length,
      data,
    });
  } 
  catch (error) 
  {
    return ErrorHandler.handle(res, error);
  }
}

export async function getByLabel(req, res) 
{
  try 
  {
    const { label } = req.params;

    if (!label) 
    {
      return res.status(400).json({ error: "Label é obrigatório" });
    }

    const data = await searchDetection(label);

    if (!data || data.length === 0) 
    {
      return res.status(404).json({ message: "Nenhuma detection encontrada" });
    }

      return res.status(200).json(data);
    } 
  catch (error) 
  {
    return ErrorHandler.handle(res, error);
  }
}

export async function getByTimestamp(req, res) 
{
  try 
  {
    const { timestamp } = req.params;

    if (!timestamp) 
    {
      return res.status(400).json({ error: "Timestamp é obrigatório" });
    }

    const data = await searchDetectionByDay(timestamp);

    if (!data || data.length === 0) 
    {
      return res.status(404).json({ message: "Nenhuma detection encontrada" });
    }

    return res.status(200).json(data);
  } 
  catch (error) 
  {
    return ErrorHandler.handle(res, error);
  }
}