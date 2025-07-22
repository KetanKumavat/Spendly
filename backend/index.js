require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const webhookRoutes = require("./routes/webhook");
const authRoutes = require("./routes/auth");
const expensesRoutes = require("./routes/expenses");
const app = express();

app.use(
    cors({
        origin: [
            "http://localhost:3001",
            "https://spendly-frontend.vercel.app",
            process.env.FRONTEND_URL,
        ].filter(Boolean),
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/webhook", webhookRoutes);
app.use("/auth", authRoutes);
app.use("/expenses", expensesRoutes);

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: "Server is up and running",
    });
});

app.get("/keep-alive", (req, res) => {
    res.json({
        status: "alive",
        timestamp: new Date().toISOString(),
        message: "Keep-alive ping successful",
    });
});

if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_KEEP_ALIVE === "true"
) {
    const serverUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;

    if (serverUrl) {
        cron.schedule("*/40 * * * *", async () => {
            try {
                const fetch = (await import("node-fetch")).default;
                const response = await fetch(`${serverUrl}/keep-alive`);
                const data = await response.json();
            } catch (error) {
                console.error(
                    `Keep-alive ping failed at ${new Date().toISOString()}:`,
                    error.message
                );
            }
        });

        console.log(
            `Keep-alive cron job scheduled for ${serverUrl}/keep-alive (every 40 minutes)`
        );
    } else {
        console.log("Keep-alive disabled: SERVER_URL not configured");
    }
} else {
    console.log("Keep-alive disabled in development mode");
}

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
