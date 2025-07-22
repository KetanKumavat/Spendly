const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const sendWhatsApp = require("../utils/twilioWhatsapp");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/generate-magic-link", async (req, res) => {
    const { phone, sendViaWhatsApp = false } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });

    let user = await prisma.user.findUnique({ where: { phoneNumber: phone } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                id: phone,
                phoneNumber: phone,
                name: `User ${phone.slice(-4)}`,
            },
        });
    }

    const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: "15m" });

    const magicLink = `${
        process.env.FRONTEND_URL || "http://localhost:3001"
    }/dashboard?token=${token}`;

    // Send via WhatsApp if requested
    if (sendViaWhatsApp) {
        try {
            const whatsappMessage = `🔗 *Your Spendly Dashboard Link*

${magicLink}

✅ Valid for 15 minutes
🔒 Secure access to your expense analytics
📊 View your spending insights and budgets

*Tip:* Bookmark this page after logging in!`;

            await sendWhatsApp(phone, whatsappMessage);
            return res.json({
                success: true,
                message: "Magic link sent via WhatsApp",
                link: magicLink,
            });
        } catch (error) {
            console.error("Failed to send WhatsApp message:", error);
            return res.status(500).json({
                error: "Failed to send WhatsApp message",
                link: magicLink,
            });
        }
    }

    return res.json({ link: magicLink });
});

router.get("/magic", async (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(400).send("Missing token");

    try {
        const { phone } = jwt.verify(token, JWT_SECRET);

        // Redirect to frontend dashboard
        return res.redirect(
            `${
                process.env.FRONTEND_URL || "http://localhost:3001"
            }/dashboard?token=${token}`
        );
    } catch (err) {
        return res.status(401).send("Invalid or expired token");
    }
});

// Verify token endpoint for frontend
router.post("/verify-token", async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });

    try {
        const { phone } = jwt.verify(token, JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { phoneNumber: phone },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json(user);
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
});

// WhatsApp authentication endpoint
router.post("/whatsapp-login", async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number required" });

    try {
        if (!JWT_SECRET) {
            console.error("JWT_SECRET is not configured");
            return res
                .status(500)
                .json({ error: "Server configuration error" });
        }

        const cleanPhone = phone.replace("whatsapp:", "");

        let user = await prisma.user.findUnique({
            where: { phoneNumber: cleanPhone },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: cleanPhone,
                    phoneNumber: cleanPhone,
                    name: `User ${cleanPhone.slice(-4)}`,
                },
            });
        }

        const token = jwt.sign({ phone: cleanPhone }, JWT_SECRET, {
            expiresIn: "1h",
        });

        const magicLink = `${
            process.env.FRONTEND_URL || "http://localhost:3001"
        }/dashboard?token=${token}`;

        const whatsappMessage = `🔗 Your Spendly Dashboard Link

${magicLink}

✅ Valid for 15 minutes
🔒 Secure access to your expense analytics
📊 View your spending insights and budgets

Tip: Bookmark this page after logging in!`;

        await sendWhatsApp(cleanPhone, whatsappMessage);

        return res.json({
            success: true,
            message: "Dashboard link sent to your WhatsApp",
        });
    } catch (error) {
        console.error("WhatsApp login error:", error);
        return res.status(500).json({
            error: "Failed to send login link",
            details:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
});

module.exports = router;
