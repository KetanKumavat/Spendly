const twilio = require("twilio");
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsApp(to, message) {
    try {
        const msg = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `whatsapp:${to}`,
        });
        // console.log("Sent via Twilio:", msg.sid);
    } catch (err) {
        console.error("Twilio send failed:", err.message);
    }
}

module.exports = sendWhatsApp;
