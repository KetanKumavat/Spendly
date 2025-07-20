const axios = require("axios");
const { getMediaUrl, downloadMediaBuffer } = require("../utils/whatsapp");
const cloudinary = require("../utils/cloudinary");
const { PrismaClient } = require("@prisma/client");
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

            // Auto reply
            await axios.post(
                `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: from,
                    text: { body: `You said: ${text}` },
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.META_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        if (type === "image") {
            const imageId = message.image.id;
            console.log(`Image ID: ${imageId}`);

            const token = process.env.META_TOKEN;

            const mediaUrl = await getMediaUrl(imageId, token);

            const buffer = await downloadMediaBuffer(mediaUrl, token);

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

            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "whatsapp-expenses",
                },
                async (error, result) => {
                    if (error) {
                        console.error("❌ Cloudinary error", error);
                        return;
                    }

                    await prisma.expense.create({
                        data: {
                            userId: from,
                            imageUrl: result.secure_url,
                            source: "whatsapp",
                            amount: 100,
                            category: "Uncategorized",
                            description: "Expense from WhatsApp",
                        },
                    });

                    console.log("Image saved to DB Successfully ✅");
                }
            );

            stream.end(buffer);
        }

        res.sendStatus(200);
    } catch (err) {
        console.error("❌ Error in handler:", err);
        res.sendStatus(500);
    }
};
