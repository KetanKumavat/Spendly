const { parseExpenseQuery } = require("./gemini");

class ExpenseAnalytics {
    /**
     * Parse and execute natural language expense queries
     * @param {string} query - User's natural language query
     * @param {Object} prisma - Prisma client instance
     * @param {string} phoneNumber - User's phone number
     * @returns {Promise<string>} - Formatted response message
     */
    static async parseAndExecuteQuery(query, prisma, phoneNumber) {
        try {
            if (!query || !query.trim()) {
                return this.getHelpMessage();
            }

            // Parse using Gemini
            // console.log(`Parsing query: "${query}"`);
            const queryParams = await parseExpenseQuery(query);

            if (!queryParams.isValid) {
                return `❌ *Query not understood*\n\n${
                    queryParams.error || "Please try a different format."
                }\n\n${this.getQueryExamples()}`;
            }

            return await this.executeQuery(queryParams, prisma, phoneNumber);
        } catch (error) {
            console.error("Query processing failed:", error.message);
            return `❌ *Analysis failed*\n\nSorry, I couldn't process your query. Please try again or use one of these formats:\n\n${this.getQueryExamples()}`;
        }
    }

    /**
     * Execute parsed query parameters
     * @param {Object} queryParams - Parsed query parameters
     * @param {Object} prisma - Prisma client instance
     * @param {string} phoneNumber - User's phone number
     * @returns {Promise<string>} - Formatted response
     */
    static async executeQuery(queryParams, prisma, phoneNumber) {
        const { timeframe, category, analysisType, startDate, endDate, limit } =
            queryParams;

        try {
            // Build where clause
            const whereClause = await this.buildWhereClause(
                phoneNumber,
                category,
                startDate,
                endDate
            );

            // Execute based on analysis type
            switch (analysisType) {
                case "total":
                    return await this.getTotalExpenses(
                        whereClause,
                        prisma,
                        timeframe,
                        category
                    );

                case "summary":
                    return await this.getSummaryAnalysis(
                        whereClause,
                        prisma,
                        timeframe,
                        category
                    );

                case "top":
                    return await this.getTopAnalysis(
                        whereClause,
                        prisma,
                        timeframe,
                        limit || 5
                    );

                case "breakdown":
                    return await this.getCategoryBreakdown(
                        whereClause,
                        prisma,
                        timeframe
                    );

                default:
                    return await this.getSummaryAnalysis(
                        whereClause,
                        prisma,
                        timeframe,
                        category
                    );
            }
        } catch (error) {
            console.error("Query execution failed:", error.message);
            throw new Error("Failed to execute expense query");
        }
    }

    /**
     * Build Prisma where clause
     * @param {string} phoneNumber - User's phone number
     * @param {string} category - Category filter
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {Object} - Prisma where clause
     */
    static async buildWhereClause(phoneNumber, category, startDate, endDate) {
        const whereClause = { userId: phoneNumber };

        // Add date filter
        if (startDate && endDate) {
            whereClause.createdAt = {
                gte: new Date(startDate + "T00:00:00.000Z"),
                lte: new Date(endDate + "T23:59:59.999Z"),
            };
        }

        // Add category filter
        if (category) {
            whereClause.category = {
                contains: category,
                mode: "insensitive",
            };
        }

        return whereClause;
    }

    /**
     * Get total expenses
     */
    static async getTotalExpenses(whereClause, prisma, timeframe, category) {
        const expenses = await prisma.expense.findMany({
            where: whereClause,
            select: { amount: true, createdAt: true },
        });

        if (expenses.length === 0) {
            return this.getNoDataMessage(timeframe, category);
        }

        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = expenses.length;
        const average = total / count;

        return `💰 *Total Expenses*\n\n${this.formatPeriodHeader(
            timeframe,
            category
        )}💵 *Amount:* ₹${this.formatCurrency(
            total
        )}\n📊 *Transactions:* ${count}\n📈 *Average:* ₹${this.formatCurrency(
            average
        )}`;
    }

    static async getSummaryAnalysis(whereClause, prisma, timeframe, category) {
        const expenses = await prisma.expense.findMany({
            where: whereClause,
            select: {
                amount: true,
                category: true,
                description: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        if (expenses.length === 0) {
            return this.getNoDataMessage(timeframe, category);
        }

        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        const categoryTotals = this.calculateCategoryTotals(expenses);
        const topCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        let response = `📊 *Expense Summary*\n\n${this.formatPeriodHeader(
            timeframe,
            category
        )}💰 *Total:* ₹${this.formatCurrency(total)}\n📈 *Transactions:* ${
            expenses.length
        }\n\n*Top Categories:*\n`;

        topCategories.forEach(([cat, amount], index) => {
            const percentage = ((amount / total) * 100).toFixed(1);
            response += `${index + 1}. ${cat}: ₹${this.formatCurrency(
                amount
            )} (${percentage}%)\n`;
        });

        // Recent transactions
        if (!category) {
            response += `\n*Recent Transactions:*\n`;
            expenses.slice(0, 3).forEach((exp) => {
                const vendor = this.extractVendor(exp.description);
                response += `• ₹${this.formatCurrency(
                    exp.amount
                )} - ${vendor}\n`;
            });
        }

        return response;
    }

    static async getTopAnalysis(whereClause, prisma, timeframe, limit) {
        const expenses = await prisma.expense.findMany({
            where: whereClause,
            select: { amount: true, category: true, description: true },
        });

        if (expenses.length === 0) {
            return this.getNoDataMessage(timeframe);
        }

        const categoryTotals = this.calculateCategoryTotals(expenses);
        const total = Object.values(categoryTotals).reduce(
            (sum, amount) => sum + amount,
            0
        );
        const topCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit);

        let response = `🏆 *Top ${limit} Categories*\n\n${this.formatPeriodHeader(
            timeframe
        )}💰 *Total Spending:* ₹${this.formatCurrency(total)}\n\n`;

        topCategories.forEach(([cat, amount], index) => {
            const percentage = ((amount / total) * 100).toFixed(1);
            const medal = this.getMedal(index);
            response += `${medal} *${cat}*\n₹${this.formatCurrency(
                amount
            )} (${percentage}%)\n\n`;
        });

        return response;
    }

    /**
     * Get category breakdown
     */
    static async getCategoryBreakdown(whereClause, prisma, timeframe) {
        return await this.getSummaryAnalysis(whereClause, prisma, timeframe);
    }

    /**
     * Helper: Calculate category totals
     */
    static calculateCategoryTotals(expenses) {
        const categoryTotals = {};
        expenses.forEach((exp) => {
            const cat = exp.category || "Uncategorized";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
        });
        return categoryTotals;
    }

    /**
     * Helper: Format currency
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
        }).format(amount);
    }

    /**
     * Helper: Get medal emoji
     */
    static getMedal(index) {
        const medals = ["🥇", "🥈", "🥉", "🏅", "🏅"];
        return medals[index] || "🏅";
    }

    /* Helper: Extract vendor from description*/
    static extractVendor(description) {
        if (!description) return "Unknown";

        const vendorMatch = description.match(/Vendor:\s*([^|]+)/);
        return vendorMatch ? vendorMatch[1].trim() : "Unknown";
    }

    /**
     * Helper: Format period header
     */
    static formatPeriodHeader(timeframe, category) {
        let header = "";
        if (timeframe) header += `📅 Period: ${timeframe}\n`;
        if (category) header += `🏷️ Category: ${category}\n`;
        if (header) header += "\n";
        return header;
    }

    /**
     * Helper: No data message
     */
    static getNoDataMessage(timeframe, category) {
        return `📊 *No expenses found*\n\n${this.formatPeriodHeader(
            timeframe,
            category
        )}Start tracking your expenses! 💪`;
    }

    /**
     * Helper: Query examples
     */
    static getQueryExamples() {
        return `*Try these examples:*\n• "How much did I spend on food this month?"\n• "Show my total expenses for July"\n• "Top 3 categories last week"\n• "My shopping expenses today"`;
    }

    /**
     * Helper: Help message
     */
    static getHelpMessage() {
        return `📊 *Expense Analytics Help*\n\n${this.getQueryExamples()}\n\n*Supported formats:*\n• Time: today, this week, this month, July 2025\n• Categories: food, transport, shopping, etc.\n• Analysis: total, summary, top categories`;
    }
}

module.exports = ExpenseAnalytics;
