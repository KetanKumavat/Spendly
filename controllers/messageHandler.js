const axios = require("axios");
const cloudinary = require("../utils/cloudinary");
const { PrismaClient } = require("@prisma/client");
const { extractTextFromImage } = require("../utils/ocr");
const { extractExpenseData } = require("../utils/gemini");
const sendWhatsApp = require("../utils/twilioWhatsapp");
const SpendlyBot = require("../utils/spendlyBot");

const prisma = new PrismaClient();

//using meta api
// module.exports = async (req, res) => {
//     const entry = req.body.entry?.[0];
//     const changes = entry?.changes?.[0];
//     const message = changes?.value?.messages?.[0];

//     if (!message) return res.sendStatus(200);

//     const from = message.from;
//     const type = message.type;

//     try {
//         if (type === "text") {
//             const text = message.text.body;
//             console.log(`Text: ${text}`);

//             let user = await prisma.user.findUnique({
//                 where: { id: from },
//             });

//             if (!user) {
//                 user = await prisma.user.create({
//                     data: {
//                         id: from,
//                         phoneNumber: from,
//                     },
//                 });
//             }

//             let expenseData = {};
//             try {
//                 console.log("Sending plain text to Gemini for parsing...");
//                 expenseData = await extractExpenseData(text);
//                 console.log("Parsed Text Expense:", expenseData);

//                 const saved = await prisma.expense.create({
//                     data: {
//                         userId: from,
//                         imageUrl: null,
//                         source: "whatsapp",
//                         amount: parseFloat(expenseData.total) || 0,
//                         category: "Auto Extracted",
//                         description: `Vendor: ${
//                             expenseData.vendor || "N/A"
//                         } | Date: ${expenseData.date || "N/A"}`,
//                         rawText: text,
//                         structuredData: expenseData,
//                     },
//                 });

//                 const feedbackMsg = `Saved ₹${expenseData.total || 0} for "${
//                     expenseData.vendor || "item"
//                 }" on ${expenseData.date || "today"}.`;

//                 // await axios.post(
//                 //     `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
//                 //     {
//                 //         messaging_product: "whatsapp",
//                 //         to: from,
//                 //         text: { body: feedbackMsg },
//                 //     },
//                 //     {
//                 //         headers: {
//                 //             Authorization: `Bearer ${process.env.META_TOKEN}`,
//                 //             "Content-Type": "application/json",
//                 //         },
//                 //     }
//                 // );

//                 await sendWhatsApp(from, feedbackMsg);
//             } catch (err) {
//                 console.error("Text parsing failed:", err);

//                 // await axios.post(
//                 //     `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
//                 //     {
//                 //         messaging_product: "whatsapp",
//                 //         to: from,
//                 //         text: {
//                 //             body: `Sorry, I couldn't understand that. Try sending like: "30rs lunch at canteen" or send a bill image.`,
//                 //         },
//                 //     },
//                 //     {
//                 //         headers: {
//                 //             Authorization: `Bearer ${process.env.META_TOKEN}`,
//                 //             "Content-Type": "application/json",
//                 //         },
//                 //     }
//                 // );

//                 await sendWhatsApp(
//                     from,
//                     'Sorry, I couldn\'t understand that. Try sending like: "30rs lunch at canteen" or send a bill image.'
//                 );
//             }
//         }

//         if (type === "image") {
//             const imageId = message.image.id;
//             console.log(`Image ID: ${imageId}`);

//             const token = process.env.META_TOKEN;

//             const mediaUrl = await getMediaUrl(imageId, token);
//             const buffer = await downloadMediaBuffer(mediaUrl, token);

//             let user = await prisma.user.findUnique({ where: { id: from } });
//             if (!user) {
//                 user = await prisma.user.create({
//                     data: { id: from, phoneNumber: from, name: `User ${from}` },
//                 });
//             }

//             const stream = cloudinary.uploader.upload_stream(
//                 { folder: "whatsapp-expenses" },
//                 async (error, result) => {
//                     if (error) {
//                         console.error("Cloudinary error", error);

//                         // await axios.post(
//                         //     `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
//                         //     {
//                         //         messaging_product: "whatsapp",
//                         //         to: from,
//                         //         text: {
//                         //             body: `Sorry, there was an error uploading your image. Please try again later.`,
//                         //         },
//                         //     },
//                         //     {
//                         //         headers: {
//                         //             Authorization: `Bearer ${process.env.META_TOKEN}`,
//                         //             "Content-Type": "application/json",
//                         //         },
//                         //     }
//                         // );

//                         await sendWhatsApp(
//                             from,
//                             "Sorry, there was an error uploading your image. Please try again later."
//                         );

//                         return;
//                     }

//                     let ocrText = "";
//                     let expenseData = {};

//                     try {
//                         console.log("Extracting text using OCR...");
//                         ocrText = await extractTextFromImage(result.secure_url);
//                         console.log("OCR Text:", ocrText);

//                         console.log(
//                             "🔎 Sending text to Gemini for structuring..."
//                         );
//                         expenseData = await extractExpenseData(ocrText);
//                         console.log("Structured Data:", expenseData);
//                     } catch (ocrOrGeminiError) {
//                         console.error(
//                             "OCR or Gemini failed:",
//                             ocrOrGeminiError
//                         );

//                         await prisma.expense.create({
//                             data: {
//                                 userId: from,
//                                 imageUrl: result.secure_url,
//                                 source: "whatsapp",
//                                 amount: 0,
//                                 category: "Uncategorized",
//                                 description: "Auto extraction failed",
//                                 rawText: ocrText,
//                                 structuredData: {},
//                             },
//                         });

//                         // await axios.post(
//                         //     `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
//                         //     {
//                         //         messaging_product: "whatsapp",
//                         //         to: from,
//                         //         text: {
//                         //             body: `Expense details couldn't be extracted, but the bill has been saved.\nWe'll improve this soon!`,
//                         //         },
//                         //     },
//                         //     {
//                         //         headers: {
//                         //             Authorization: `Bearer ${process.env.META_TOKEN}`,
//                         //             "Content-Type": "application/json",
//                         //         },
//                         //     }
//                         // );

//                         await sendWhatsApp(
//                             from,
//                             "Expense details couldn't be extracted, but the bill has been saved.\nWe'll improve this soon!"
//                         );

//                         return;
//                     }

//                     const amount = parseFloat(expenseData.total) || 0;
//                     const vendor = expenseData.vendor || "Unknown Vendor";
//                     const dateStr = expenseData.date || "Unknown Date";

//                     await prisma.expense.create({
//                         data: {
//                             userId: from,
//                             imageUrl: result.secure_url,
//                             source: "whatsapp",
//                             amount,
//                             category: "Auto Extracted",
//                             description: `Vendor: ${vendor} | Date: ${dateStr}`,
//                             rawText: ocrText,
//                             structuredData: expenseData,
//                         },
//                     });

//                     console.log("Expense saved to DB");

//                     const feedbackMsg = `Expense saved!\nVendor: ${vendor}\nAmount: ₹${amount}\nDate: ${dateStr}`;

//                     // await axios.post(
//                     //     `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
//                     //     {
//                     //         messaging_product: "whatsapp",
//                     //         to: from,
//                     //         text: { body: feedbackMsg },
//                     //     },
//                     //     {
//                     //         headers: {
//                     //             Authorization: `Bearer ${process.env.META_TOKEN}`,
//                     //             "Content-Type": "application/json",
//                     //         },
//                     //     }
//                     // );

//                     await sendWhatsApp(userNumber, feedbackMsg);
//                 }
//             );

//             stream.end(buffer);
//         }

//         res.sendStatus(200);
//     } catch (err) {
//         console.error("Unhandled error in handler:", err);

//         // await axios.post(
//         //     `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
//         //     {
//         //         messaging_product: "whatsapp",
//         //         to: from,
//         //         text: {
//         //             body: ``,
//         //         },
//         //     },
//         //     {
//         //         headers: {
//         //             Authorization: `Bearer ${process.env.META_TOKEN}`,
//         //             "Content-Type": "application/json",
//         //         },
//         //     }
//         // );

//         await sendWhatsApp(
//             from,
//             "Unexpected error occurred. Please retry or contact support."
//         );

//         res.sendStatus(500);
//     }
// };

//using twilio api

const MessagingResponse = require("twilio").twiml.MessagingResponse;

module.exports = async (req, res) => {
    try {
        if (
            (req.body.MessageStatus && req.body.MessageStatus !== "received") ||
            (req.body.SmsStatus && req.body.SmsStatus !== "received") ||
            req.body.Payload
        ) {
            // console.log("Status callback received:", {
            //     messageStatus: req.body.MessageStatus,
            //     smsStatus: req.body.SmsStatus,
            //     messageSid: req.body.MessageSid || req.body.SmsSid,
            // });
            const twiml = new MessagingResponse();
            res.type("text/xml");
            return res.send(twiml.toString());
        }

        const from = req.body.From;
        const body = req.body.Body;
        const numMedia = parseInt(req.body.NumMedia) || 0;

        // console.log("Extracted data:", { from, body, numMedia });

        if (!from) {
            console.warn(
                "Twilio message payload malformed - missing From:",
                req.body
            );
            const twiml = new MessagingResponse();
            res.type("text/xml");
            return res.send(twiml.toString());
        }

        const phoneNumber = from.replace("whatsapp:", "");
        // console.log(`New message from ${phoneNumber}: "${body}"`);

        let user = await prisma.user.findUnique({
            where: { id: phoneNumber },
        });

        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            user = await prisma.user.create({
                data: {
                    id: phoneNumber,
                    phoneNumber: phoneNumber,
                    name: `User ${phoneNumber.slice(-4)}`,
                },
            });
        } else {
            // console.log("Existing user found:", user.name);
        }

        // text messages
        if (body && numMedia === 0) {
            console.log(`Text: ${body}`);
            console.log(`Is "${body}" a command?`, SpendlyBot.isCommand(body));

            if (SpendlyBot.isCommand(body)) {
                // console.log(`Command detected: ${body}`);
                try {
                    const response = await SpendlyBot.handleCommand(
                        body,
                        phoneNumber,
                        prisma
                    );

                    await sendWhatsApp(phoneNumber, response);
                    const twiml = new MessagingResponse();
                    res.type("text/xml");
                    return res.send(twiml.toString());
                } catch (error) {
                    console.error("Error handling command:", error);
                    await sendWhatsApp(
                        phoneNumber,
                        "❌ Sorry, something went wrong. Please try again."
                    );
                    const twiml = new MessagingResponse();
                    res.type("text/xml");
                    return res.send(twiml.toString());
                }
            }

            const lowerBody = body.toLowerCase().trim();
            const greetings = ["hi", "hello", "hey", "start", "begin"];

            if (greetings.some((greeting) => lowerBody === greeting)) {
                if (isNewUser) {
                    const welcomeMsg = SpendlyBot.getWelcomeMessage(true);
                    await sendWhatsApp(phoneNumber, welcomeMsg);
                } else {
                    const welcomeMsg = SpendlyBot.getWelcomeMessage(false);
                    await sendWhatsApp(phoneNumber, welcomeMsg);
                }
                const twiml = new MessagingResponse();
                res.type("text/xml");
                return res.send(twiml.toString());
            }

            if (isNewUser) {
                const welcomeMsg = SpendlyBot.getWelcomeMessage(true);
                await sendWhatsApp(phoneNumber, welcomeMsg);

                await new Promise((resolve) => setTimeout(resolve, 3000));
                await sendWhatsApp(
                    phoneNumber,
                    "Now, let's process your first expense! 🚀"
                );
            }

            // Process expense
            let expenseData = {};
            try {
                // if (!isNewUser) {
                //     await sendWhatsApp(
                //         phoneNumber,
                //         SpendlyBot.getProcessingMessage(false)
                //     );
                // }

                expenseData = await extractExpenseData(body);

                await prisma.expense.create({
                    data: {
                        userId: phoneNumber,
                        imageUrl: null,
                        source: "whatsapp",
                        amount: parseFloat(expenseData.total) || 0,
                        category: "Auto Extracted",
                        description: `Vendor: ${
                            expenseData.vendor || "N/A"
                        } | Date: ${expenseData.date || "N/A"}`,
                        rawText: body,
                        structuredData: expenseData,
                    },
                });

                const successMsg = SpendlyBot.getSuccessMessage(
                    expenseData,
                    false
                );
                await sendWhatsApp(phoneNumber, successMsg);
            } catch (e) {
                // console.error("Gemini parsing failed:", e);
                const errorMsg = SpendlyBot.getErrorMessage("parsing");
                await sendWhatsApp(phoneNumber, errorMsg);
            }
        } else if (numMedia > 0) {
            // console.log(`Received ${numMedia} media files`);

            const mediaUrl = req.body.MediaUrl0;
            const mediaContentType = req.body.MediaContentType0;

            if (!mediaUrl || !mediaContentType.startsWith("image/")) {
                const errorMsg = SpendlyBot.getErrorMessage("image");
                await sendWhatsApp(phoneNumber, errorMsg);
                const twiml = new MessagingResponse();
                res.type("text/xml");
                return res.send(twiml.toString());
            }

            //wait - processing message
            // await sendWhatsApp(
            //     phoneNumber,
            //     SpendlyBot.getProcessingMessage(true)
            // );

            try {
                const response = await axios.get(mediaUrl, {
                    responseType: "arraybuffer",
                    auth: {
                        username: process.env.TWILIO_ACCOUNT_SID,
                        password: process.env.TWILIO_AUTH_TOKEN,
                    },
                });

                const buffer = Buffer.from(response.data);

                const stream = cloudinary.uploader.upload_stream(
                    { folder: "whatsapp-expenses" },
                    async (error, result) => {
                        if (error) {
                            console.error("Cloudinary error", error);
                            const errorMsg =
                                SpendlyBot.getErrorMessage("general");
                            await sendWhatsApp(phoneNumber, errorMsg);
                            return;
                        }

                        let ocrText = "";
                        let expenseData = {};

                        try {
                            console.log("Extracting text using OCR...");
                            ocrText = await extractTextFromImage(
                                result.secure_url
                            );
                            // console.log("OCR Text:", ocrText);

                            console.log(
                                "Sending text to Gemini for structuring..."
                            );
                            expenseData = await extractExpenseData(ocrText);
                            // console.log("Structured Data:", expenseData);
                        } catch (ocrOrGeminiError) {
                            console.error(
                                "OCR or Gemini failed:",
                                ocrOrGeminiError
                            );

                            await prisma.expense.create({
                                data: {
                                    userId: phoneNumber,
                                    imageUrl: result.secure_url,
                                    source: "whatsapp",
                                    amount: 0,
                                    category: "Uncategorized",
                                    description: "Auto extraction failed",
                                    rawText: ocrText,
                                    structuredData: {},
                                },
                            });

                            const errorMsg = `⚠️ *Couldn't extract expense details*

Your bill has been saved, but I couldn't read the details automatically. 

💡 *Try:*
• Sending a clearer photo
• Or tell me manually: "50rs coffee at cafe"

I'll keep improving! 🚀`;
                            await sendWhatsApp(phoneNumber, errorMsg);
                            return;
                        }

                        const saved = await prisma.expense.create({
                            data: {
                                userId: phoneNumber,
                                imageUrl: result.secure_url,
                                source: "whatsapp",
                                amount: parseFloat(expenseData.total) || 0,
                                category: "Auto Extracted",
                                description: `Vendor: ${
                                    expenseData.vendor || "N/A"
                                } | Date: ${expenseData.date || "N/A"}`,
                                rawText: ocrText,
                                structuredData: expenseData,
                            },
                        });

                        const successMsg = SpendlyBot.getSuccessMessage(
                            expenseData,
                            true
                        );
                        await sendWhatsApp(phoneNumber, successMsg);
                    }
                );

                stream.end(buffer);
            } catch (error) {
                console.error("Error processing image:", error);
                const errorMsg = SpendlyBot.getErrorMessage("general");
                await sendWhatsApp(phoneNumber, errorMsg);
            }
        } else {
            if (isNewUser) {
                const welcomeMsg = SpendlyBot.getWelcomeMessage(true);
                await sendWhatsApp(phoneNumber, welcomeMsg);
            } else {
                const helpMsg = SpendlyBot.getWelcomeMessage(false);
                await sendWhatsApp(phoneNumber, helpMsg);
            }
        }

        const twiml = new MessagingResponse();
        res.type("text/xml");
        res.send(twiml.toString());
    } catch (err) {
        console.error("❌ Server error:", err);
        const twiml = new MessagingResponse();
        res.type("text/xml");
        res.status(500).send(twiml.toString());
    }
};
