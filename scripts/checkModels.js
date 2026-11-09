require("dotenv").config();

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("GEMINI_API_KEY was not found in environment variables.");
        process.exitCode = 1;
        return;
    }

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models",
            {
                headers: {
                    "x-goog-api-key": apiKey,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("API Error:", response.status);
            console.error(data.error?.message || data);
            process.exitCode = 1;
            return;
        }

        const models = (data.models || []).filter((model) =>
            (model.supportedGenerationMethods || []).includes("generateContent")
        );

        console.log("\nAvailable Gemini models supporting generateContent:\n");

        models.forEach((model) => {
            console.log(
                `${model.name} — ${model.displayName || "No display name"}`
            );
        });

        console.log(`\nTotal models available: ${models.length}`);
    } catch (error) {
        console.error("Request failed:", error.message);
        process.exitCode = 1;
    }
}

if (require.main === module) {
    checkModels();
}

module.exports = checkModels;
