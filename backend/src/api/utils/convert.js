import fs from "fs/promises";
import path from "path";

export async function base64ToImage(base64String, folderPath) {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");

    const buffer = Buffer.from(base64Data, "base64");

    const fileName = `frame_${Date.now()}.jpg`;

    const filePath = path.join(folderPath, fileName);

    await fs.writeFile(filePath, buffer);

    return filePath;
}
