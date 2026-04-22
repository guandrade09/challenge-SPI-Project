import fs from "fs";
import path from "path";

export async function createFolderByTimestamp(timestamp, basePath = "./backend/src/uploads") 
{
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const hour = String(date.getUTCHours()).padStart(2, "0");
    const minute = String(date.getUTCMinutes()).padStart(2, "0");
    const second = String(date.getUTCSeconds()).padStart(2, "0");

    const safeTime = `${hour}-${minute}-${second}`;

    const folderPath = path.join(
        basePath,
        year.toString(),
        month,
        day,
        safeTime
    );

    fs.mkdirSync(folderPath, { recursive: true });

    return folderPath;
}