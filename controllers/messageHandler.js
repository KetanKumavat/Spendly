const axios = require("axios");
const { getMediaUrl, downloadMediaBuffer } = require("../utils/whatsapp");
const cloudinary = require("../utils/cloudinary");
const { PrismaClient } = require("@prisma/client");
const { extractTextFromImage } = require("../utils/ocr");
const { extractExpenseData } = require("../utils/gemini");

const prisma = new PrismaClient();

module.exports = async (req, res) => {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const type = message.type;

    try {
        if (type === "text") {
            const text = message.text.body;
            console.log(`📩 Text: ${text}`);

            let user = await prisma.user.findUnique({
                where: { id: from },
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        id: from,
                        phoneNumber: from,
                    },
                });
            }

            let expenseData = {};
            try {
                console.log("Sending plain text to Gemini for parsing...");
                expenseData = await extractExpenseData(text);
                console.log("✅ Parsed Text Expense:", expenseData);

                const saved = await prisma.expense.create({
                    data: {
                        userId: from,
                        imageUrl: null,
                        source: "whatsapp",
                        amount: parseFloat(expenseData.total) || 0,
                        category: "Auto Extracted",
                        description: `Vendor: ${
                            expenseData.vendor || "N/A"
                        } | Date: ${expenseData.date || "N/A"}`,
                        rawText: text,
                        structuredData: expenseData,
                    },
                });

                const feedbackMsg = `✅ Saved ₹${expenseData.total || 0} for "${
                    expenseData.vendor || "item"
                }" on ${expenseData.date || "today"}.`;

                await axios.post(
                    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
                    {
                        messaging_product: "whatsapp",
                        to: from,
                        text: { body: feedbackMsg },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.META_TOKEN}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
            } catch (err) {
                console.error("❌ Text parsing failed:", err);

                await axios.post(
                    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
                    {
                        messaging_product: "whatsapp",
                        to: from,
                        text: {
                            body: `❌ Sorry, I couldn't understand that. Try sending like: "30rs lunch at canteen" or send a bill image.`,
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.META_TOKEN}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }
        }

        if (type === "image") {
            const imageId = message.image.id;
            console.log(`📷 Image ID: ${imageId}`);

            const token = process.env.META_TOKEN;

            const mediaUrl = await getMediaUrl(imageId, token);
            const buffer = await downloadMediaBuffer(mediaUrl, token);

            let user = await prisma.user.findUnique({ where: { id: from } });
            if (!user) {
                user = await prisma.user.create({
                    data: { id: from, phoneNumber: from, name: `User ${from}` },
                });
            }

            const stream = cloudinary.uploader.upload_stream(
                { folder: "whatsapp-expenses" },
                async (error, result) => {
                    if (error) {
                        console.error("❌ Cloudinary error", error);

                        await axios.post(
                            `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
                            {
                                messaging_product: "whatsapp",
                                to: from,
                                text: {
                                    body: `❌ Sorry, there was an error uploading your image. Please try again later.`,
                                },
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${process.env.META_TOKEN}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );

                        return;
                    }

                    let ocrText = "";
                    let expenseData = {};

                    try {
                        console.log("🔍 Extracting text using OCR...");
                        ocrText = await extractTextFromImage(result.secure_url);
                        console.log("✅ OCR Text:", ocrText);

                        console.log(
                            "🔎 Sending text to Gemini for structuring..."
                        );
                        expenseData = await extractExpenseData(ocrText);
                        console.log("✅ Structured Data:", expenseData);
                    } catch (ocrOrGeminiError) {
                        console.error(
                            "❌ OCR or Gemini failed:",
                            ocrOrGeminiError
                        );

                        await prisma.expense.create({
                            data: {
                                userId: from,
                                imageUrl: result.secure_url,
                                source: "whatsapp",
                                amount: 0,
                                category: "Uncategorized",
                                description: "Auto extraction failed",
                                rawText: ocrText,
                                structuredData: {},
                            },
                        });

                        await axios.post(
                            `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
                            {
                                messaging_product: "whatsapp",
                                to: from,
                                text: {
                                    body: `⚠️ Expense details couldn't be extracted, but the bill has been saved.\nWe'll improve this soon!`,
                                },
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${process.env.META_TOKEN}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );

                        return;
                    }

                    const amount = parseFloat(expenseData.total) || 0;
                    const vendor = expenseData.vendor || "Unknown Vendor";
                    const dateStr = expenseData.date || "Unknown Date";

                    await prisma.expense.create({
                        data: {
                            userId: from,
                            imageUrl: result.secure_url,
                            source: "whatsapp",
                            amount,
                            category: "Auto Extracted",
                            description: `Vendor: ${vendor} | Date: ${dateStr}`,
                            rawText: ocrText,
                            structuredData: expenseData,
                        },
                    });

                    console.log("✅ Expense saved to DB");

                    const feedbackMsg = `✅ Expense saved!\nVendor: ${vendor}\nAmount: ₹${amount}\nDate: ${dateStr}`;

                    await axios.post(
                        `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
                        {
                            messaging_product: "whatsapp",
                            to: from,
                            text: { body: feedbackMsg },
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${process.env.META_TOKEN}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }
            );

            stream.end(buffer);
        }

        res.sendStatus(200);
    } catch (err) {
        console.error("❌ Unhandled error in handler:", err);

        await axios.post(
            `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: from,
                text: {
                    body: `🚨 Unexpected error occurred. Please retry or contact support.`,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.META_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.sendStatus(500);
    }
};
