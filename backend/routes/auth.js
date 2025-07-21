const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/generate-magic-link", async (req, res) => {
    const { phone } = req.body;
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

module.exports = router;
