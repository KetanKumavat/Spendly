const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is required");
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    async executeWithRetry(prompt, retryCount = 0) {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let textResponse = response.text().trim();

            // Clean markdown formatting
            if (textResponse.startsWith("```")) {
                textResponse = textResponse
                    .replace(/```(?:json)?\n?/g, "")
                    .replace(/```$/, "")
                    .trim();
            }

            return textResponse;
        } catch (error) {
            console.error(
                `Gemini API error (attempt ${retryCount + 1}):`,
                error.message
            );

            if (retryCount < this.maxRetries) {
                console.log(`Retrying in ${this.retryDelay}ms...`);
                await new Promise((resolve) =>
                    setTimeout(resolve, this.retryDelay)
                );
                return this.executeWithRetry(prompt, retryCount + 1);
            }

            throw new Error(
                `Gemini API failed after ${this.maxRetries} attempts: ${error.message}`
            );
        }
    }

    /**
     * Parse JSON response with validation
     * @param {string} jsonString - JSON string to parse
     * @param {string} context - Context for error logging
     * @returns {Object} - Parsed JSON object
     */
    parseJsonResponse(jsonString, context = "Gemini response") {
        try {
            const parsed = JSON.parse(jsonString);
            return parsed;
        } catch (error) {
            console.error(`❌ Invalid JSON in ${context}:`, jsonString);
            throw new Error(`Invalid JSON response from Gemini in ${context}`);
        }
    }

    /**
     * Extract structured expense data from text or OCR
     * @param {string} text - Input text (casual message or OCR text)
     * @returns {Promise<Object>} - Structured expense data
     */
    async extractExpenseData(text) {
        const prompt = `You are an intelligent expense extractor for a production WhatsApp expense tracking bot.

TASK: Extract structured data from expense text (casual messages or OCR from receipts).

INPUT TEXT: "${text}"

OUTPUT FORMAT (JSON only, no extra text):
{
  "total": "<amount as number, no currency>",
  "vendor": "<merchant/person name>",
  "date": "<YYYY-MM-DD or empty>",
  "items": ["<item list or empty array>"],
  "confidence": "<high|medium|low>"
}

RULES:
1. Extract the PRIMARY expense amount (what user actually paid)
2. Vendor can be person, shop, app, or service name
3. Only include date if explicitly mentioned
4. Items should be specific purchases if identifiable
5. Confidence: high (clear data), medium (some ambiguity), low (unclear)

EXAMPLES:
"Paid 45rs to Ketan" → {"total": "45", "vendor": "Ketan", "date": "", "items": [], "confidence": "high"}
"Zomato lunch ₹230" → {"total": "230", "vendor": "Zomato", "date": "", "items": ["lunch"], "confidence": "high"}
"Amazon shopping 1200" → {"total": "1200", "vendor": "Amazon", "date": "", "items": ["shopping"], "confidence": "medium"}

OCR Receipt:
"McDonald's
2x Big Mac - ₹400
1x Fries - ₹100
Total: ₹500
Date: 15/07/2025"
→ {"total": "500", "vendor": "McDonald's", "date": "2025-07-15", "items": ["2x Big Mac", "1x Fries"], "confidence": "high"}

Return JSON only:`;

        try {
            const response = await this.executeWithRetry(prompt);
            const expenseData = this.parseJsonResponse(
                response,
                "expense extraction"
            );

            if (!expenseData.total || isNaN(parseFloat(expenseData.total))) {
                throw new Error("Invalid or missing expense amount");
            }

            return {
                total: expenseData.total,
                vendor: expenseData.vendor || "Unknown",
                date: expenseData.date || "",
                items: expenseData.items || [],
                confidence: expenseData.confidence || "medium",
            };
        } catch (error) {
            console.error("❌ Expense extraction failed:", error.message);
            throw new Error("Failed to extract expense data");
        }
    }

    /**
     * Categorize expense into predefined categories
     * @param {string} text - Expense description
     * @param {string} vendor - Vendor name
     * @param {number} amount - Expense amount
     * @returns {Promise<string>} - Category name
     */
    async categorizeExpense(text, vendor = "", amount = 0) {
        const categories = [
            "Food & Dining",
            "Transportation",
            "Shopping",
            "Groceries",
            "Entertainment",
            "Healthcare",
            "Utilities",
            "Education",
            "Personal Care",
            "Miscellaneous",
        ];

        const prompt = `TASK: Categorize this expense into ONE category from the list below.

CATEGORIES: ${categories.join(", ")}

EXPENSE DETAILS:
- Description: "${text}"
- Vendor: "${vendor}"
- Amount: ₹${amount}

CATEGORIZATION RULES:
1. Food & Dining: Restaurants, food delivery, cafes, dining out
2. Transportation: Uber, fuel, parking, public transport, flights
3. Shopping: Clothes, electronics, online purchases, retail
4. Groceries: Supermarkets, vegetables, daily essentials
5. Entertainment: Movies, games, streaming, books, concerts
6. Healthcare: Doctors, medicines, hospitals, medical bills
7. Utilities: Electricity, water, internet, phone bills
8. Education: Courses, books, tuition, training
9. Personal Care: Salon, gym, cosmetics, fitness
10. Miscellaneous: Everything else

EXAMPLES:
- "Zomato order" + "Zomato" → Food & Dining
- "Uber ride" + "Uber" → Transportation
- "Amazon purchase" + "Amazon" → Shopping
- "Electricity bill" + "MSEB" → Utilities

Return ONLY the category name (exact match from list above):`;

        try {
            const response = await this.executeWithRetry(prompt);
            const category = response.trim();

            // Validate category
            if (categories.includes(category)) {
                return category;
            }

            console.warn(
                `⚠️ Invalid category returned: ${category}, defaulting to Miscellaneous`
            );
            return "Miscellaneous";
        } catch (error) {
            console.error("❌ Categorization failed:", error.message);
            return "Miscellaneous";
        }
    }

    /**
     * Parse natural language expense queries
     * @param {string} query - User query about expenses
     * @returns {Promise<Object>} - Parsed query parameters
     */
    async parseExpenseQuery(query) {
        const currentDate = new Date().toISOString().split("T")[0];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const prompt = `TASK: Parse this natural language expense query into structured parameters.

USER QUERY: "${query}"

OUTPUT FORMAT (JSON only):
{
  "timeframe": "<specific period or null>",
  "category": "<category name or null>",
  "analysisType": "<total|summary|top|breakdown>",
  "startDate": "<YYYY-MM-DD or null>",
  "endDate": "<YYYY-MM-DD or null>",
  "limit": "<number or null>",
  "isValid": true
}

TIME PERIOD CALCULATIONS (Current date: ${currentDate}):
- "today" → ${currentDate} to ${currentDate}
- "this month" → ${currentYear}-${String(currentMonth).padStart(
            2,
            "0"
        )}-01 to ${currentDate}
- "July 2025" → 2025-07-01 to 2025-07-31

ANALYSIS TYPES:
- total: Sum of expenses
- summary: Detailed breakdown with categories
- top: Top categories/expenses (use limit field)
- breakdown: Category-wise analysis

EXAMPLES:
"How much did I spend on food this month?" → {"timeframe": "this month", "category": "Food & Dining", "analysisType": "total", "startDate": "${currentYear}-${String(
            currentMonth
        ).padStart(
            2,
            "0"
        )}-01", "endDate": "${currentDate}", "limit": null, "isValid": true}

"Top 3 categories last week" → {"timeframe": "last week", "category": null, "analysisType": "top", "startDate": "2025-07-14", "endDate": "2025-07-21", "limit": 3, "isValid": true}

Return JSON only:`;

        try {
            const response = await this.executeWithRetry(prompt);
            const queryParams = this.parseJsonResponse(
                response,
                "query parsing"
            );

            queryParams.isValid = queryParams.isValid !== false;
            return queryParams;
        } catch (error) {
            console.error("❌ Query parsing failed:", error.message);
            return { isValid: false, error: "Could not understand the query" };
        }
    }

    /**
     * Parse budget setting commands
     * @param {string} command - Budget command from user
     * @returns {Promise<Object>} - Parsed budget parameters
     */
    async parseBudgetCommand(command) {
        const prompt = `TASK: Parse this budget setting command into structured parameters.

COMMAND: "${command}"

OUTPUT FORMAT (JSON only):
{
  "category": "<category name>",
  "amount": <number>,
  "period": "<monthly|weekly|daily>",
  "isValid": true
}

CATEGORY MAPPING:
- food/dining/restaurant → "Food & Dining"
- travel/transport/uber/ola → "Transportation"
- shopping/clothes/amazon → "Shopping"
- grocery/vegetables/supermarket → "Groceries"
- movie/entertainment → "Entertainment"
- medical/health/doctor → "Healthcare"
- bill/utility/electricity → "Utilities"
- education/course/book → "Education"
- gym/salon/beauty → "Personal Care"

EXAMPLES:
"Set budget for food as 5000 this month" → {"category": "Food & Dining", "amount": 5000, "period": "monthly", "isValid": true}
"Set travel budget 3000 monthly" → {"category": "Transportation", "amount": 3000, "period": "monthly", "isValid": true}

Return JSON only:`;

        try {
            const response = await this.executeWithRetry(prompt);
            const budgetParams = this.parseJsonResponse(
                response,
                "budget parsing"
            );

            if (!budgetParams.amount || budgetParams.amount <= 0) {
                budgetParams.isValid = false;
                budgetParams.error = "Invalid amount";
            }

            return budgetParams;
        } catch (error) {
            console.error("❌ Budget parsing failed:", error.message);
            return {
                isValid: false,
                error: "Could not understand the budget command",
            };
        }
    }
}

const geminiService = new GeminiService();

module.exports = {
    extractExpenseData: (text) => geminiService.extractExpenseData(text),
    categorizeExpense: (text, vendor, amount) =>
        geminiService.categorizeExpense(text, vendor, amount),
    parseExpenseQuery: (query) => geminiService.parseExpenseQuery(query),
    parseBudgetCommand: (command) => geminiService.parseBudgetCommand(command),
    GeminiService,
};
