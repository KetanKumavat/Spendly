const { categorizeExpense } = require("./gemini");

class SmartCategorization {
    // Predefined categories with optimized keywords
    static categories = {
        "Food & Dining": {
            keywords: [
                // Food delivery apps
                "zomato",
                "swiggy",
                "uber eats",
                "food panda",
                "dominos",
                "pizza hut",
                // Restaurant types
                "restaurant",
                "cafe",
                "coffee",
                "tea",
                "starbucks",
                "ccd",
                "barista",
                // Food items
                "lunch",
                "dinner",
                "breakfast",
                "snack",
                "meal",
                "food",
                "pizza",
                "burger",
                "biryani",
                "chinese",
                "indian",
                "continental",
                // Quick service
                "mcdonalds",
                "kfc",
                "subway",
                "burger king",
                "taco bell",
            ],
            confidence: 0.9,
        },
        Transportation: {
            keywords: [
                // Ride sharing
                "uber",
                "ola",
                "lyft",
                "taxi",
                "cab",
                "auto",
                "rickshaw",
                // Fuel & vehicle
                "petrol",
                "diesel",
                "fuel",
                "gas",
                "cng",
                "parking",
                // Public transport
                "bus",
                "metro",
                "train",
                "railway",
                "irctc",
                "ticket",
                // Travel
                "flight",
                "airline",
                "indigo",
                "spicejet",
                "toll",
                "highway",
            ],
            confidence: 0.9,
        },
        Shopping: {
            keywords: [
                // E-commerce
                "amazon",
                "flipkart",
                "myntra",
                "ajio",
                "nykaa",
                "meesho",
                // Retail
                "shopping",
                "mall",
                "store",
                "outlet",
                "market",
                // Electronics
                "mobile",
                "phone",
                "laptop",
                "electronics",
                "appliance",
                // Clothing
                "clothes",
                "shirt",
                "shoes",
                "dress",
                "fashion",
            ],
            confidence: 0.8,
        },
        Groceries: {
            keywords: [
                // Supermarkets
                "grocery",
                "supermarket",
                "dmart",
                "reliance",
                "big bazaar",
                "more",
                // Fresh produce
                "vegetables",
                "fruits",
                "milk",
                "bread",
                "eggs",
                "rice",
                // Local stores
                "kirana",
                "general store",
                "provision",
                "daily needs",
            ],
            confidence: 0.9,
        },
        Entertainment: {
            keywords: [
                // Streaming & digital
                "netflix",
                "amazon prime",
                "hotstar",
                "spotify",
                "youtube",
                // Movies & events
                "movie",
                "cinema",
                "pvr",
                "inox",
                "ticket",
                "show",
                // Gaming & books
                "game",
                "steam",
                "playstation",
                "xbox",
                "book",
                "kindle",
            ],
            confidence: 0.8,
        },
        Healthcare: {
            keywords: [
                // Medical services
                "doctor",
                "hospital",
                "clinic",
                "medical",
                "health",
                // Pharmacy
                "medicine",
                "pharmacy",
                "chemist",
                "apollo",
                "medplus",
                // Specialists
                "dentist",
                "checkup",
                "consultation",
                "surgery",
                "treatment",
            ],
            confidence: 0.9,
        },
        Utilities: {
            keywords: [
                // Bills
                "electricity",
                "water",
                "gas",
                "bill",
                "utility",
                // Telecom
                "internet",
                "wifi",
                "broadband",
                "mobile",
                "recharge",
                "airtel",
                "jio",
                "vodafone",
                "bsnl",
                "postpaid",
                "prepaid",
            ],
            confidence: 0.9,
        },
        Education: {
            keywords: [
                "school",
                "college",
                "university",
                "course",
                "fees",
                "tuition",
                "coaching",
                "education",
                "training",
                "certification",
                "book",
                "study",
                "exam",
                "admission",
            ],
            confidence: 0.8,
        },
        "Personal Care": {
            keywords: [
                "salon",
                "haircut",
                "spa",
                "massage",
                "beauty",
                "cosmetics",
                "gym",
                "fitness",
                "yoga",
                "personal trainer",
                "grooming",
            ],
            confidence: 0.7,
        },
    };

    /**
     * Quick keyword-based categorization with confidence scoring
     * @param {string} text - Expense description
     * @param {string} vendor - Vendor name
     * @returns {Object} - {category, confidence, method}
     */
    static quickCategorize(text, vendor = "") {
        const searchText = `${text} ${vendor}`.toLowerCase().trim();

        if (!searchText) {
            return {
                category: "Miscellaneous",
                confidence: 0.1,
                method: "default",
            };
        }

        let bestMatch = {
            category: "Miscellaneous",
            confidence: 0,
            method: "keyword",
        };

        for (const [category, data] of Object.entries(this.categories)) {
            let matches = 0;
            let maxKeywordScore = 0;

            for (const keyword of data.keywords) {
                if (searchText.includes(keyword)) {
                    matches++;
                    const keywordScore = keyword.length / 10;
                    maxKeywordScore = Math.max(maxKeywordScore, keywordScore);
                }
            }

            if (matches > 0) {
                const confidence = Math.min(
                    (matches * 0.3 + maxKeywordScore * 0.7) * data.confidence,
                    0.95
                );

                if (confidence > bestMatch.confidence) {
                    bestMatch = { category, confidence, method: "keyword" };
                }
            }
        }

        return bestMatch;
    }

    /**
     * Main categorization method with production-level error handling
     * @param {string} text - Expense description
     * @param {string} vendor - Vendor name
     * @param {number} amount - Expense amount
     * @returns {Promise<Object>} - {category, confidence, method}
     */
    static async categorize(text, vendor = "", amount = 0) {
        try {
            if (!text && !vendor) {
                console.warn("⚠️ Empty text and vendor for categorization");
                return {
                    category: "Miscellaneous",
                    confidence: 0.1,
                    method: "default",
                };
            }

            const quickResult = this.quickCategorize(text, vendor);

            if (quickResult.confidence >= 0.7) {
                // console.log(
                //     `📊 Quick categorized as: ${
                //         quickResult.category
                //     } (${quickResult.confidence.toFixed(2)})`
                // );
                return quickResult;
            }

            // console.log("Using AI for enhanced categorization...");
            const aiCategory = await categorizeExpense(text, vendor, amount);

            // Validate AI response
            const validCategories = [
                ...Object.keys(this.categories),
                "Miscellaneous",
            ];

            if (validCategories.includes(aiCategory)) {
                // console.log(`🤖 AI categorized as: ${aiCategory}`);
                return {
                    category: aiCategory,
                    confidence: 0.8,
                    method: "ai",
                };
            }

            console.warn(`AI returned invalid category: ${aiCategory}`);
            return quickResult.confidence > 0
                ? quickResult
                : {
                      category: "Miscellaneous",
                      confidence: 0.3,
                      method: "fallback",
                  };
        } catch (error) {
            console.error("Categorization failed:", error.message);

            const fallbackResult = this.quickCategorize(text, vendor);
            return fallbackResult.confidence > 0
                ? fallbackResult
                : {
                      category: "Miscellaneous",
                      confidence: 0.2,
                      method: "error_fallback",
                  };
        }
    }

    /**
     * Get all available categories
     * @returns {Array<string>} - List of category names
     */
    static getCategories() {
        return [...Object.keys(this.categories), "Miscellaneous"];
    }

    /**
     * Get category statistics for analytics
     * @returns {Object} - Category metadata
     */
    static getCategoryMetadata() {
        const metadata = {};

        for (const [category, data] of Object.entries(this.categories)) {
            metadata[category] = {
                keywordCount: data.keywords.length,
                baseConfidence: data.confidence,
                examples: data.keywords.slice(0, 3), // First 3 keywords as eg
            };
        }

        return metadata;
    }
}

module.exports = SmartCategorization;
