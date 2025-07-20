const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../utils/cloudinary");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const { userId, amount, category, description } = req.body;

        if (!req.file)
            return res.status(400).json({ error: "No file uploaded" });

        const result = await cloudinary.uploader.upload_stream(
            { folder: "whatsapp-expenses" },
            async (error, result) => {
                if (error) return res.status(500).json({ error });

                const expense = await prisma.expense.create({
                    data: {
                        userId,
                        amount: parseFloat(amount),
                        category,
                        description,
                        imageUrl: result.secure_url,
                        source: "manual",
                    },
                });

                res.status(200).json({ success: true, expense });
            }
        );

        const stream = result;
        stream.end(req.file.buffer);
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
