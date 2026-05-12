import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

export async function createFolderByTimestamp(timestamp, basePath = "./backend/src/api/uploads/imgens") 
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

function normalizeRemotePath(remoteFolderPath) {
    return String(remoteFolderPath || "").replace(/^\/+|\/+$/g, "");
}

function buildOneDrivePath(remoteFolderPath, fileName) {
    const normalizedFolder = normalizeRemotePath(remoteFolderPath);
    const remotePath = normalizedFolder ? `${normalizedFolder}/${fileName}` : fileName;
    return encodeURI(remotePath).replace(/#/g, "%23").replace(/\?/g, "%3F");
}

async function getOneDriveItem(remotePath, accessToken) {
    const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURI(remotePath)}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (response.ok) {
        return await response.json();
    }

    if (response.status === 404) {
        return null;
    }

    const errorText = await response.text();
    throw new Error(`Falha ao consultar OneDrive (${response.status}): ${errorText}`);
}

async function createOneDriveFolderSegment(folderName, parentRemoteFolderPath, accessToken) {
    const parentUrl = parentRemoteFolderPath
        ? `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURI(parentRemoteFolderPath)}:/children`
        : `https://graph.microsoft.com/v1.0/me/drive/root/children`;

    const response = await fetch(parentUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: folderName,
            folder: {},
            "@microsoft.graph.conflictBehavior": "rename",
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao criar pasta no OneDrive (${response.status}): ${errorText}`);
    }

    return await response.json();
}

export async function ensureOneDriveFolder(remoteFolderPath, accessToken) {
    if (!remoteFolderPath) {
        return null;
    }

    if (!accessToken) {
        throw new Error("Access token do OneDrive é obrigatório");
    }

    const normalizedFolder = normalizeRemotePath(remoteFolderPath);
    const segments = normalizedFolder.split("/").filter(Boolean);

    let currentPath = "";
    for (const segment of segments) {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        const item = await getOneDriveItem(currentPath, accessToken);

        if (!item) {
            const parentPath = currentPath.split("/").slice(0, -1).join("/");
            await createOneDriveFolderSegment(segment, parentPath, accessToken);
        }
    }

    return normalizedFolder;
}

export async function createOneDriveFolderByTimestamp(timestamp, accessToken, baseRemotePath = "") {
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const hour = String(date.getUTCHours()).padStart(2, "0");
    const minute = String(date.getUTCMinutes()).padStart(2, "0");
    const second = String(date.getUTCSeconds()).padStart(2, "0");

    const safeTime = `${hour}-${minute}-${second}`;
    const normalizedBasePath = normalizeRemotePath(baseRemotePath);
    const remoteFolderPath = [normalizedBasePath, year, month, day, safeTime].filter(Boolean).join("/");

    await ensureOneDriveFolder(remoteFolderPath, accessToken);

    return remoteFolderPath;
}

export async function uploadFileToOneDrive(localFilePath, accessToken, remoteFolderPath = "") {
    if (!accessToken) {
        throw new Error("Access token do OneDrive é obrigatório");
    }

    if (remoteFolderPath) {
        await ensureOneDriveFolder(remoteFolderPath, accessToken);
    }

    const fileBuffer = await fsPromises.readFile(localFilePath);
    const fileName = path.basename(localFilePath);
    const remotePath = buildOneDrivePath(remoteFolderPath, fileName);
    const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${remotePath}:/content`;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao enviar arquivo para OneDrive (${response.status}): ${errorText}`);
    }

    return await response.json();
}

export async function uploadBase64ImageToOneDrive(base64String, accessToken, remoteFolderPath = "", fileName = null) {
    if (!base64String) {
        throw new Error("String base64 da imagem é obrigatória");
    }

    if (remoteFolderPath) {
        await ensureOneDriveFolder(remoteFolderPath, accessToken);
    }

    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const fileBuffer = Buffer.from(base64Data, "base64");
    const finalName = fileName || `photo_${Date.now()}.jpg`;
    const remotePath = buildOneDrivePath(remoteFolderPath, finalName);
    const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${remotePath}:/content`;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/octet-stream",
        },
        body: fileBuffer,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao enviar imagem para OneDrive (${response.status}): ${errorText}`);
    }

    return await response.json();
}

export async function savePdfToUploads(pdfBuffer, fileName = null) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseName = fileName || `relatorio-${timestamp}`;
        const filePath = path.resolve("backend/src/api/uploads/relatorios/pdf/", `${baseName}.pdf`);

        const uploadsDir = path.dirname(filePath);
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        fs.writeFileSync(filePath, pdfBuffer);

        console.log(`PDF salvo com sucesso: ${filePath}`);
        return filePath;

    } catch (error) {
        console.error("Erro ao salvar PDF:", error);
        throw error;
    }
}

export async function saveExcel(workbook, fileName = null) 
{
    const reportsDir = path.resolve(
        "backend/src/api/uploads/relatorios/excel"
    );

    if (!fs.existsSync(reportsDir)) 
    {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const finalFileName = fileName || `report-${Date.now()}.xlsx`;

    const filePath = path.join(reportsDir, finalFileName);

    await workbook.xlsx.writeFile(filePath);

    return {
        fileName: finalFileName,
        filePath
    };
}