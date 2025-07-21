const axios = require("axios");
const cloudinary = require("../utils/cloudinary");
const { PrismaClient } = require("@prisma/client");
const { extractTextFromImage } = require("../utils/ocr");
const { GeminiService } = require("../utils/gemini");

const sendWhatsApp = require("../utils/twilioWhatsapp");
const SpendlyBot = require("../utils/spendlyBot");
const SmartCategorization = require("../utils/smartCategorization");
const BudgetManager = require("../utils/budgetManager");

const prisma = new PrismaClient();
const geminiService = new GeminiService();

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

                expenseData = await geminiService.extractExpenseData(body);
                // console.log("Parsed:", expenseData);
                const categorizationResult =
                    await SmartCategorization.categorize(
                        body,
                        expenseData.vendor || "",
                        expenseData.total || 0
                    );
                // Smart categorization
                const smartCategory = categorizationResult.category;
                const newExpense = await prisma.expense.create({
                    data: {
                        userId: phoneNumber,
                        imageUrl: null,
                        source: "whatsapp",
                        amount: parseFloat(expenseData.total) || 0,
                        category: smartCategory,
                        description: `Vendor: ${
                            expenseData.vendor || "N/A"
                        } | Date: ${expenseData.date || "N/A"}`,
                        rawText: body,
                        structuredData: expenseData,
                    },
                });

                // Check for budget alerts
                const budgetAlerts = await BudgetManager.checkBudgetAlerts(
                    prisma,
                    phoneNumber,
                    newExpense
                );

                const successMsg = SpendlyBot.getSuccessMessage(
                    { ...expenseData, category: smartCategory },
                    false
                );
                await sendWhatsApp(phoneNumber, successMsg);

                // Send budget alerts if any
                for (const alert of budgetAlerts) {
                    await sendWhatsApp(phoneNumber, alert);
                }
            } catch (e) {
                // console.error("Expense processing failed:", e);
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
                            expenseData =
                                await geminiService.extractExpenseData(ocrText);
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

                        const categorizationResult =
                            await SmartCategorization.categorize(
                                ocrText,
                                expenseData.vendor || "",
                                expenseData.total || 0
                            );
                        const smartCategory = categorizationResult.category;
                        const saved = await prisma.expense.create({
                            data: {
                                userId: phoneNumber,
                                imageUrl: result.secure_url,
                                source: "whatsapp",
                                amount: parseFloat(expenseData.total) || 0,
                                category: smartCategory,
                                description: `Vendor: ${
                                    expenseData.vendor || "N/A"
                                } | Date: ${expenseData.date || "N/A"}`,
                                rawText: ocrText,
                                structuredData: expenseData,
                            },
                        });

                        const budgetAlerts =
                            await BudgetManager.checkBudgetAlerts(
                                prisma,
                                phoneNumber,
                                saved
                            );

                        const successMsg = SpendlyBot.getSuccessMessage(
                            { ...expenseData, category: smartCategory },
                            true
                        );
                        await sendWhatsApp(phoneNumber, successMsg);

                        for (const alert of budgetAlerts) {
                            await sendWhatsApp(phoneNumber, alert);
                        }
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
        console.error("Server error:", err);
        const twiml = new MessagingResponse();
        res.type("text/xml");
        res.status(500).send(twiml.toString());
    }
};
