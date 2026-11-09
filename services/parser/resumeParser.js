const fs = require("fs");
const os = require("os");
const path = require("path");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Creates a temporary scratch file in os.tmpdir(), executes the callback,
 * and guarantees cleanup of the temporary file in a finally block.
 */
async function withTempFile(buffer, extension = ".tmp", callback) {
    const safeExt = extension.startsWith(".") ? extension : `.${extension}`;
    const tempPath = path.join(
        os.tmpdir(),
        `resume_parse_${Date.now()}_${Math.random().toString(36).substring(7)}${safeExt}`
    );

    try {
        await fs.promises.writeFile(tempPath, buffer);
        return await callback(tempPath);
    } finally {
        try {
            if (fs.existsSync(tempPath)) {
                await fs.promises.unlink(tempPath);
            }
        } catch (unlinkErr) {
            console.warn(`[TempFile] Failed to remove temp scratch file ${tempPath}:`, unlinkErr.message);
        }
    }
}

/**
 * Extracts raw textual content from uploaded PDF or Word document.
 * Accepts either an in-memory Buffer or a file path string.
 * Uses zero permanent local disk writes.
 */
async function extractResumeText(input, mimeType) {
    let buffer;

    if (Buffer.isBuffer(input)) {
        buffer = input;
    } else if (typeof input === "string") {
        buffer = await fs.promises.readFile(input);
    } else {
        throw new Error("Invalid input: extractResumeText expects a Buffer or file path string.");
    }

    if (mimeType === "application/pdf") {
        const data = await pdf(buffer);
        return data.text || "";
    }

    if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/msword"
    ) {
        // Stream buffer through mammoth
        const result = await mammoth.extractRawText({ buffer });
        return result.value || "";
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
}

module.exports = extractResumeText;
module.exports.withTempFile = withTempFile;
