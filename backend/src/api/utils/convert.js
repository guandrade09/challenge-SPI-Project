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

export async function jpegToBase64(imageInput) {
    let buffer;

    if (Buffer.isBuffer(imageInput)) {
        buffer = imageInput;
    } else if (imageInput instanceof Uint8Array) {
        buffer = Buffer.from(imageInput);
    } else if (typeof imageInput === "string") {
        const trimmed = imageInput.trim();

        if (/^data:image\/(?:jpeg|jpg);base64,/i.test(trimmed)) {
            return trimmed.replace(/^data:image\/(?:jpeg|jpg);base64,/i, "");
        }

        if (/^data:image\/(?:jpeg|jpg);base64,/i.test(trimmed) === false && /^(?:[A-Za-z0-9+/]+={0,2})+$/.test(trimmed)) {
            return trimmed;
        }

        buffer = await fs.readFile(trimmed);
    } else {
        throw new TypeError("jpegToBase64 expects a JPEG Buffer, Uint8Array, file path, or base64 data URL.");
    }

    return buffer.toString("base64");
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