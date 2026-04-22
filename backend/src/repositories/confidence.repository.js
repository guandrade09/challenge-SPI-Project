import _Readable from "readable-stream";
import { connect } from "../utils/connection.js";
import { viewAllDetection, viewDetectionByDay } from "./detection.repository.js";

//#region :: GET CONFIDENCE DETAILS BY DAY -> Retorna quantidades de deteccoes colhetadas no dia desejado para cada nivel de confianca medido ::
export async function searchConfidenceDetailsByDay(day) 
{
    const deteccoes = await viewDetectionByDay(day);
    return _getRange(deteccoes);
}
//#endregion

//#region :: GET CONFIDENCE DETAILS -> Retorna quantidades de deteccoes colhetadas para cada nivel de confianca medido
export async function searchAllConfidenceDetail() 
{
    const deteccoes = await viewAllDetection();
    return _getRange(deteccoes);
}
//#endregion

//#region :: PRIVATE FUNCTION -> Cria e retorna payload para grafico de confianca ::
function _getRange(deteccoes)
{
    const ranges = {
        "0-20%": 0,
        "20-40%": 0,
        "40-60%": 0,
        "60-80%": 0,
        "80-100%": 0
    };

    deteccoes.forEach(d => {
        const confidence = d.confidence <= 1 
        ? d.confidence * 100 
        : d.confidence;

        if (confidence >= 0 && confidence < 20) ranges["0-20%"]++;
        else if (confidence < 40) ranges["20-40%"]++;
        else if (confidence < 60) ranges["40-60%"]++;
        else if (confidence < 80) ranges["60-80%"]++;
        else ranges["80-100%"]++;
    });

    return Object.keys(ranges).map(range => ({
        range,
        quantidade: ranges[range]
    }));
}
//#endregion