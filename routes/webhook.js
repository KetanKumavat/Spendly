const express = require("express");
const router = express.Router();
const messageHandler = require("../controllers/messageHandler");

// Meta WhatsApp webhook verification
router.get("/", (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Twilio WhatsApp webhook
router.post("/", messageHandler);

router.post("/status", (req, res) => {
    console.log("📊 Message status update:", {
        messageSid: req.body.MessageSid || req.body.SmsSid,
        status: req.body.MessageStatus || req.body.SmsStatus,
        to: req.body.To,
        from: req.body.From,
        timestamp: new Date().toISOString(),
    });

    // Just acknowledge status callbacks
    res.sendStatus(200);
});

module.exports = router;
