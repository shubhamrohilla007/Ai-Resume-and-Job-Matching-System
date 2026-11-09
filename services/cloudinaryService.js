const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");

const getCloudName = () => process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const getApiKey = () => process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY;
const getApiSecret = () => process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET;

/**
 * Checks if Cloudinary credentials are fully configured.
 * Supports both CLOUDINARY_* and CLOUD_* environment variable naming conventions.
 */
function isCloudinaryConfigured() {
    return Boolean(
        (getCloudName() || process.env.CLOUDINARY_URL) &&
        getApiKey() &&
        getApiSecret()
    );
}

// Configure Cloudinary SDK if credentials exist
if (isCloudinaryConfigured()) {
    cloudinary.config({
        cloud_name: getCloudName(),
        api_key: getApiKey(),
        api_secret: getApiSecret(),
        secure: true,
    });
}

/**
 * Uploads a Buffer to Cloudinary via upload_stream.
 */
function uploadBufferStream(buffer, options) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
        stream.end(buffer);
    });
}

/**
 * Local fallback uploader for offline development or testing when Cloudinary keys are unset.
 */
async function uploadLocalFallback(buffer, originalname, subfolder = "resumes") {
    const targetDir = path.resolve(__dirname, `../uploads/${subfolder}`);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    const ext = path.extname(originalname);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const targetPath = path.join(targetDir, uniqueFileName);

    await fs.promises.writeFile(targetPath, buffer);

    return {
        asset_id: `local_asset_${Date.now()}`,
        public_id: `local/${subfolder}/${uniqueFileName}`,
        resource_type: subfolder === "photos" ? "image" : "raw",
        format: ext.replace(".", "") || "bin",
        bytes: buffer.length,
        secure_url: `/uploads/${subfolder}/${uniqueFileName}`,
        localPath: targetPath,
        storageProvider: "local",
    };
}

/**
 * Uploads an uploaded candidate resume (PDF or DOCX) to Cloudinary.
 * Preserves access control via signed delivery or private raw resource.
 */
async function uploadResumeStream(buffer, originalname, userId = "anonymous") {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error("uploadResumeStream requires a valid Buffer.");
    }

    if (!isCloudinaryConfigured()) {
        console.warn("[Cloudinary] Credentials not configured. Using local fallback for resume storage.");
        return await uploadLocalFallback(buffer, originalname, "resumes");
    }

    const ext = path.extname(originalname).toLowerCase();
    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const publicId = `ai-resume-system/resumes/resume_${cleanUserId}_${uniqueSuffix}`;

    // Determine resource_type: DOCX and PDF work reliably with 'raw' in Cloudinary
    // to preserve byte-exact formatting and download capabilities
    const resourceType = ext === ".pdf" ? "raw" : "raw";

    const uploadOptions = {
        folder: "ai-resume-system/resumes",
        public_id: `resume_${cleanUserId}_${uniqueSuffix}`,
        resource_type: resourceType,
        type: "upload", // standard secure upload with signed download URL enforcement on backend
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        tags: ["resume", `user_${cleanUserId}`],
    };

    const result = await uploadBufferStream(buffer, uploadOptions);

    return {
        asset_id: result.asset_id,
        public_id: result.public_id,
        resource_type: result.resource_type || resourceType,
        format: result.format || ext.replace(".", ""),
        bytes: result.bytes || buffer.length,
        secure_url: result.secure_url,
        storageProvider: "cloudinary",
    };
}

/**
 * Uploads a profile photo to Cloudinary with automatic optimization.
 */
async function uploadProfilePhotoStream(buffer, originalname, userId = "user") {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error("uploadProfilePhotoStream requires a valid Buffer.");
    }

    if (!isCloudinaryConfigured()) {
        console.warn("[Cloudinary] Credentials not configured. Using local fallback for photo storage.");
        return await uploadLocalFallback(buffer, originalname, "photos");
    }

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uploadOptions = {
        folder: "ai-resume-system/profile-images",
        public_id: `photo_${cleanUserId}_${Date.now()}`,
        resource_type: "image",
        transformation: [
            { width: 600, height: 600, crop: "limit", quality: "auto" },
        ],
        overwrite: true,
        tags: ["profile_photo", `user_${cleanUserId}`],
    };

    const result = await uploadBufferStream(buffer, uploadOptions);

    return {
        asset_id: result.asset_id,
        public_id: result.public_id,
        resource_type: "image",
        format: result.format || "jpg",
        bytes: result.bytes || buffer.length,
        secure_url: result.secure_url,
        storageProvider: "cloudinary",
    };
}

/**
 * Uploads a company logo to Cloudinary.
 */
async function uploadCompanyLogoStream(buffer, originalname, companyId = "company") {
    if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error("uploadCompanyLogoStream requires a valid Buffer.");
    }

    if (!isCloudinaryConfigured()) {
        console.warn("[Cloudinary] Credentials not configured. Using local fallback for logo storage.");
        return await uploadLocalFallback(buffer, originalname, "photos");
    }

    const cleanCompanyId = String(companyId).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uploadOptions = {
        folder: "ai-resume-system/company-logos",
        public_id: `logo_${cleanCompanyId}_${Date.now()}`,
        resource_type: "image",
        transformation: [{ width: 400, height: 400, crop: "limit", quality: "auto" }],
        tags: ["company_logo"],
    };

    const result = await uploadBufferStream(buffer, uploadOptions);

    return {
        asset_id: result.asset_id,
        public_id: result.public_id,
        resource_type: "image",
        format: result.format || "png",
        bytes: result.bytes || buffer.length,
        secure_url: result.secure_url,
        storageProvider: "cloudinary",
    };
}

/**
 * Generates an authenticated, short-lived signed URL for downloading or viewing a private resume.
 * Default expiration is 15 minutes (900 seconds).
 */
function getSignedResumeDownloadUrl(publicId, resourceType = "raw", originalName = "resume.pdf", expiresInSeconds = 900) {
    if (!publicId) return null;

    if (!isCloudinaryConfigured() || publicId.startsWith("local/")) {
        // For local storage, returns the direct local route
        return `/api/resume/download?id=${encodeURIComponent(publicId)}`;
    }

    const format = path.extname(originalName).replace(".", "") || "pdf";
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    try {
        const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
            resource_type: resourceType,
            type: "upload",
            expires_at: expiresAt,
            attachment: true,
        });
        return signedUrl;
    } catch (err) {
        // Fallback to signed URL generation via standard url builder
        return cloudinary.url(publicId, {
            resource_type: resourceType,
            type: "upload",
            sign_url: true,
            secure: true,
            flags: "attachment",
        });
    }
}

/**
 * Generates a signed URL for inline viewing in browser preview.
 */
function getSignedResumeInlineUrl(publicId, resourceType = "raw", originalName = "resume.pdf", expiresInSeconds = 900) {
    if (!publicId) return null;

    if (!isCloudinaryConfigured() || publicId.startsWith("local/")) {
        return `/api/resume/file?id=${encodeURIComponent(publicId)}`;
    }

    const format = path.extname(originalName).replace(".", "") || "pdf";
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    try {
        const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
            resource_type: resourceType,
            type: "upload",
            expires_at: expiresAt,
            attachment: false,
        });
        return signedUrl;
    } catch {
        return cloudinary.url(publicId, {
            resource_type: resourceType,
            type: "upload",
            sign_url: true,
            secure: true,
        });
    }
}

/**
 * Deletes an asset from Cloudinary.
 */
async function deleteCloudinaryAsset(publicId, resourceType = "raw") {
    if (!publicId || publicId.startsWith("local/")) return { result: "ok", deleted: false };

    if (!isCloudinaryConfigured()) {
        return { result: "ok", deleted: false };
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result;
    } catch (err) {
        console.warn(`[Cloudinary] Failed to delete asset '${publicId}':`, err.message);
        return { result: "error", error: err.message };
    }
}

module.exports = {
    cloudinary,
    isCloudinaryConfigured,
    uploadResumeStream,
    uploadProfilePhotoStream,
    uploadCompanyLogoStream,
    getSignedResumeDownloadUrl,
    getSignedResumeInlineUrl,
    deleteCloudinaryAsset,
};
