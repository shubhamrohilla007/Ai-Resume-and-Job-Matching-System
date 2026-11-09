require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { printSmtpDiagnostics } = require("./services/emailService");

const PORT = process.env.PORT || 8080;

async function startServer() {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            printSmtpDiagnostics();
        });

        const shutdown = (signal) => {
            console.log(`${signal} received. Closing server...`);

            server.close(() => {
                console.log("HTTP server closed.");
                process.exit(0);
            });
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();
