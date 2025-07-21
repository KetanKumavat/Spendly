require("dotenv").config();
const express = require("express");
const cors = require("cors");
const webhookRoutes = require("./routes/webhook");
const authRoutes = require("./routes/auth");
const expensesRoutes = require("./routes/expenses");
const app = express();

// CORS configuration
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

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
