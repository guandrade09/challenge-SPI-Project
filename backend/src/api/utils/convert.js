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

export function formatBrasiliaTimestamp(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date).reduce((acc, part) => {
      if (part.type) acc[part.type] = part.value;
      return acc;
    }, {});

    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${ms}-03:00`;
}

export function normalizeBrasiliaTimestamp(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
        return formatBrasiliaTimestamp();
    }
    return formatBrasiliaTimestamp(date);
}