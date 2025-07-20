require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const webhookRoutes = require("./routes/webhook");

const app = express();
app.use(bodyParser.json());

app.use("/webhook", webhookRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
