require("dotenv").config();
const express = require("express");
const webhookRoutes = require("./routes/webhook");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/webhook", webhookRoutes);

app.listen(process.env.PORT, () => {
    console.log(`🚀 Server is running on port ${process.env.PORT}`);
});
