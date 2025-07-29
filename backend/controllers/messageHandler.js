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

const messageRateLimit = new Map();
const MAX_DAILY_MESSAGES = 10;
const DAILY_WINDOW = 24 * 60 * 60 * 1000;

setInterval(() => {
    const now = Date.now();
    for (const [key, data] of messageRateLimit.entries()) {
        if (now - data.lastReset > DAILY_WINDOW) {
            messageRateLimit.delete(key);
        }
    }
}, 60 * 60 * 1000);

function checkRateLimit(phoneNumber) {
    const now = Date.now();
    const key = phoneNumber;

    if (!messageRateLimit.has(key)) {
        messageRateLimit.set(key, {
            dailyCount: 0,
            lastReset: now,
            isBlocked: false,
        });
    }

    const data = messageRateLimit.get(key);

    if (now - data.lastReset > DAILY_WINDOW) {
        data.dailyCount = 0;
        data.lastReset = now;
        data.isBlocked = false;
    }

    if (data.isBlocked) {
        const resetHours = Math.ceil(
            (DAILY_WINDOW - (now - data.lastReset)) / (1000 * 60 * 60)
        );
        return {
            allowed: false,
            reason: "blocked",
            resetIn: DAILY_WINDOW - (now - data.lastReset),
            resetHours: resetHours,
            current: data.dailyCount,
            limit: MAX_DAILY_MESSAGES,
        };
    }

    if (data.dailyCount >= MAX_DAILY_MESSAGES) {
        data.isBlocked = true;
        messageRateLimit.set(key, data);

        const resetHours = Math.ceil(
            (DAILY_WINDOW - (now - data.lastReset)) / (1000 * 60 * 60)
        );
        return {
            allowed: false,
            reason: "daily_limit_exceeded",
            resetIn: DAILY_WINDOW - (now - data.lastReset),
            resetHours: resetHours,
            current: data.dailyCount,
            limit: MAX_DAILY_MESSAGES,
        };
    }

    data.dailyCount++;
    messageRateLimit.set(key, data);

    return {
        allowed: true,
        remaining: MAX_DAILY_MESSAGES - data.dailyCount,
        current: data.dailyCount,
        limit: MAX_DAILY_MESSAGES,
    };
}

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

        const rateLimitCheck = checkRateLimit(phoneNumber);
        if (!rateLimitCheck.allowed) {
            const twiml = new MessagingResponse();
            let message;

            if (
                rateLimitCheck.reason === "daily_limit_exceeded" ||
                rateLimitCheck.reason === "blocked"
            ) {
                message = `🚫 *Daily Message Limit Exceeded*

You've used all *${rateLimitCheck.limit} messages* for today (${rateLimitCheck.current}/${rateLimitCheck.limit}).

Your number is now *blocked* for the next *${rateLimitCheck.resetHours} hours*.

🌐 *Continue tracking expenses:*
• Use our web dashboard for unlimited access
• Type "dashboard" for the link

⏰ *Reset:* Your limit will reset in ${rateLimitCheck.resetHours} hours.`;
            }

            twiml.message(message);
            res.type("text/xml");
            return res.send(twiml.toString());
        }

        if (rateLimitCheck.remaining <= 3 && rateLimitCheck.remaining > 0) {
            const warningMessage = `⚠️ *Message Limit Warning*

You have *${rateLimitCheck.remaining} messages* remaining today (${rateLimitCheck.current}/${rateLimitCheck.limit} used).

💡 *Tip:* Use our web dashboard for unlimited access!`;

            // Send warning asynchronously so it doesn't block processing
            sendWhatsApp(phoneNumber, warningMessage).catch((err) =>
                console.error("Failed to send warning message:", err)
            );
        }

        let user = await prisma.user.findUnique({
            where: { id: phoneNumber },
        });

        let isNewUser = false;
        let isFirstMessage = false;
        if (!user) {
            isNewUser = true;
            isFirstMessage = true;
            user = await prisma.user.create({
                data: {
                    id: phoneNumber,
                    phoneNumber: phoneNumber,
                    name: `User ${phoneNumber.slice(-4)}`,
                    isFirstTime: true, // Mark
                },
            });
        } else if (user.isFirstTime) {
            isFirstMessage = true;
        }

        // text messages
        if (body && numMedia === 0) {
            // console.log(`Text: ${body}`);

            if (isFirstMessage) {
                await prisma.user.update({
                    where: { id: phoneNumber },
                    data: { isFirstTime: false },
                });

                const welcomeMessage = `🎉 *Welcome to Spendly!*

Great! I can see you've successfully joined our WhatsApp expense tracker! 

✨ *What can I do for you?*
• 💸 Track expenses: Just tell me "50rs coffee" or "1200 groceries"
• 📷 Upload receipts: Send photos of bills for automatic extraction
• 📊 Get insights: Type "summary" for spending analytics
• 🔗 Dashboard: Type "dashboard" for web access
• ❓ Help: Type "help" for all commands

*Let's process your message!* 👇`;

                await sendWhatsApp(phoneNumber, welcomeMessage);

                // Add a small delay before processing their actual message
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            // console.log(`Is "${body}" a command?`, SpendlyBot.isCommand(body));

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
                if (isNewUser || isFirstMessage) {
                    const followUpMsg =
                        "Perfect! Now try sending an expense like '50rs coffee' or '1200 groceries' to get started! 🚀";
                    await sendWhatsApp(phoneNumber, followUpMsg);
                } else {
                    const welcomeMsg = SpendlyBot.getWelcomeMessage(false);
                    await sendWhatsApp(phoneNumber, welcomeMsg);
                }
                const twiml = new MessagingResponse();
                res.type("text/xml");
                return res.send(twiml.toString());
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
                        } | Date: ${expenseData.date || new Date().toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                        })}`,
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
            if (isFirstMessage) {
                await prisma.user.update({
                    where: { id: phoneNumber },
                    data: { isFirstTime: false },
                });

                const welcomeMessage = `🎉 *Welcome to Spendly!*

Great! I can see you've successfully joined our WhatsApp expense tracker and sent a receipt! 

✨ *What can I do for you?*
• 💸 Track expenses: Just tell me "50rs coffee" or "1200 groceries"
• 📷 Upload receipts: Send photos of bills for automatic extraction
• 📊 Get insights: Type "summary" for spending analytics
• 🔗 Dashboard: Type "dashboard" for web access
• ❓ Help: Type "help" for all commands

*Let me process your receipt now!* 👇`;

                await sendWhatsApp(phoneNumber, welcomeMessage);

                // Add a small delay before processing the image
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

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
                            // console.log("Extracting text using OCR...");
                            // ocrText = await extractTextFromImage(
                            //     result.secure_url
                            // );
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
                                } | Date: ${expenseData.date || new Date().toLocaleDateString('en-IN', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric' 
                                })}`,
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
            if (isFirstMessage) {
                await prisma.user.update({
                    where: { id: phoneNumber },
                    data: { isFirstTime: false },
                });

                const welcomeMessage = `🎉 *Welcome to Spendly!*

Great! I can see you've successfully joined our WhatsApp expense tracker! 

✨ *What can I do for you?*
• 💸 Track expenses: Just tell me "50rs coffee" or "1200 groceries"
• 📷 Upload receipts: Send photos of bills for automatic extraction
• 📊 Get insights: Type "summary" for spending analytics
• 🔗 Dashboard: Type "dashboard" for web access
• ❓ Help: Type "help" for all commands

*Try sending your first expense!* For example: "100rs lunch at McDonald's" 🚀`;

                await sendWhatsApp(phoneNumber, welcomeMessage);
            } else if (isNewUser) {
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
