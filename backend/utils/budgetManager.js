const { parseBudgetCommand } = require("./gemini");
class BudgetManager {
    static PERIODS = {
        monthly: { days: 30, label: "Monthly" },
        weekly: { days: 7, label: "Weekly" },
        daily: { days: 1, label: "Daily" },
    };

    // Default alert threshold (80%)
    static DEFAULT_ALERT_THRESHOLD = 0.8;

    /**
     * Parse and execute budget setting commands
     * @param {string} command - Budget command from user
     * @param {Object} prisma - Prisma client instance
     * @param {string} phoneNumber - User's phone number
     * @returns {Promise<string>} - Response message
     */
    static async parseAndSetBudget(command, prisma, phoneNumber) {
        try {
            if (!command || !command.trim()) {
                return this.getBudgetHelpMessage();
            }

            // console.log(`Parsing budget command: "${command}"`);
            const budgetParams = await parseBudgetCommand(command);

            if (!budgetParams.isValid) {
                return `❌ *Invalid budget command*\n\n${
                    budgetParams.error || "Please check the format."
                }\n\n${this.getBudgetExamples()}`;
            }

            // Set budget
            return await this.setBudget(budgetParams, prisma, phoneNumber);
        } catch (error) {
            console.error("Budget command processing failed:", error.message);
            return `❌ *Budget setup failed*\n\nSorry, I couldn't process your budget command. Please try again.\n\n${this.getBudgetExamples()}`;
        }
    }

    /**
     * Set a new budget with validation
     * @param {Object} budgetData - Parsed budget parameters
     * @param {Object} prisma - Prisma client instance
     * @param {string} phoneNumber - User's phone number
     * @returns {Promise<string>} - Response message
     */
    static async setBudget(budgetData, prisma, phoneNumber) {
        try {
            const { category, amount, period } = budgetData;

            // Validate budget data
            const validation = this.validateBudgetData(budgetData);
            if (!validation.isValid) {
                return `❌ *Invalid budget*\n\n${validation.error}`;
            }

            // Calculate budget period dates
            const { startDate, endDate } = this.calculateBudgetPeriod(period);

            // Check for existing budget
            const existingBudget = await this.findExistingBudget(
                prisma,
                phoneNumber,
                category,
                period,
                startDate
            );

            if (existingBudget) {
                await prisma.budget.update({
                    where: { id: existingBudget.id },
                    data: {
                        amount: amount,
                        updatedAt: new Date(),
                    },
                });

                return this.formatBudgetResponse("updated", {
                    category,
                    amount,
                    period,
                    alertAmount: amount * this.DEFAULT_ALERT_THRESHOLD,
                });
            } else {
                // Create new budget
                await prisma.budget.create({
                    data: {
                        userId: phoneNumber,
                        category: category,
                        amount: amount,
                        period: period,
                        startDate: startDate,
                        endDate: endDate,
                        isActive: true,
                        alertThreshold: this.DEFAULT_ALERT_THRESHOLD,
                    },
                });

                return this.formatBudgetResponse("created", {
                    category,
                    amount,
                    period,
                    alertAmount: amount * this.DEFAULT_ALERT_THRESHOLD,
                });
            }
        } catch (error) {
            console.error("Budget setting failed:", error.message);
            return "❌ Failed to set budget. Please try again.";
        }
    }

    /**
     * Check budget status for user
     * @param {Object} prisma - Prisma client instance
     * @param {string} phoneNumber - User's phone number
     * @param {string} category - Optional category filter
     * @returns {Promise<string>} - Budget status message
     */
    static async checkBudgetStatus(prisma, phoneNumber, category = null) {
        try {
            const now = new Date();

            let whereClause = {
                userId: phoneNumber,
                isActive: true,
                startDate: { lte: now },
                endDate: { gte: now },
            };

            if (category) {
                whereClause.category = {
                    contains: category,
                    mode: "insensitive",
                };
            }

            const budgets = await prisma.budget.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
            });

            if (budgets.length === 0) {
                return category
                    ? `📊 *No budget set for ${category}*\n\nSet one with: 'Set budget for ${category} as 5000 this month'`
                    : `📊 *No budgets set yet*\n\nCreate your first budget:\n${this.getBudgetExamples()}`;
            }

            // Generate status for each budget
            let response = category
                ? `📊 *Budget Status - ${category}*\n\n`
                : `📊 *All Budget Status*\n\n`;

            for (const budget of budgets) {
                const statusData = await this.calculateBudgetStatus(
                    prisma,
                    phoneNumber,
                    budget
                );
                response += this.formatBudgetStatus(budget, statusData);
            }

            return response;
        } catch (error) {
            console.error("Budget status check failed:", error.message);
            return "❌ Failed to check budget status.";
        }
    }

    /**
     * Check for budget alerts after new expense
     * @param {Object} prisma - Prisma client instance
     * @param {string} phoneNumber - User's phone number
     * @param {Object} newExpense - The new expense that was added
     * @returns {Promise<Array<string>>} - Array of alert messages
     */
    static async checkBudgetAlerts(prisma, phoneNumber, newExpense) {
        try {
            const now = new Date();
            const alerts = [];
            // already active budgets for this category
            const budgets = await prisma.budget.findMany({
                where: {
                    userId: phoneNumber,
                    category: {
                        contains: newExpense.category,
                        mode: "insensitive",
                    },
                    isActive: true,
                    startDate: { lte: now },
                    endDate: { gte: now },
                },
            });

            for (const budget of budgets) {
                const statusData = await this.calculateBudgetStatus(
                    prisma,
                    phoneNumber,
                    budget
                );
                const alertMessage = this.generateAlertIfNeeded(
                    budget,
                    statusData
                );

                if (alertMessage) {
                    alerts.push(alertMessage);
                }
            }

            return alerts;
        } catch (error) {
            console.error("Budget alert check failed:", error.message);
            return [];
        }
    }

    /**
     * List all budgets for a user
     * @param {Object} prisma - Prisma client instance
     * @param {string} phoneNumber - User's phone number
     * @returns {Promise<string>} - Formatted budget list
     */
    static async listBudgets(prisma, phoneNumber) {
        try {
            const budgets = await prisma.budget.findMany({
                where: {
                    userId: phoneNumber,
                    isActive: true,
                },
                orderBy: { createdAt: "desc" },
            });

            if (budgets.length === 0) {
                return `📊 *No budgets set*\n\nCreate your first budget:\n${this.getBudgetExamples()}`;
            }

            let response = `📊 *Your Budgets*\n\n`;

            for (const budget of budgets) {
                response += `🏷️ *${budget.category}*\n`;
                response += `💰 ₹${this.formatCurrency(budget.amount)} ${
                    budget.period
                }\n`;
                response += `🔔 Alert at ${(
                    budget.alertThreshold * 100
                ).toFixed(0)}%\n\n`;
            }

            response += `Type 'budget status' to see current usage!`;
            return response;
        } catch (error) {
            console.error("Budget listing failed:", error.message);
            return "❌ Failed to list budgets.";
        }
    }

    // --- HELPER METHODS ---

    static validateBudgetData(budgetData) {
        if (!budgetData.category) {
            return { isValid: false, error: "Category is required" };
        }

        if (!budgetData.amount || budgetData.amount <= 0) {
            return { isValid: false, error: "Amount must be greater than 0" };
        }

        if (!this.PERIODS[budgetData.period]) {
            return {
                isValid: false,
                error: "Invalid period. Use monthly, weekly, or daily",
            };
        }

        return { isValid: true };
    }

    static calculateBudgetPeriod(period) {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case "monthly":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0,
                    23,
                    59,
                    59,
                    999
                );
                break;

            case "weekly":
                const dayOfWeek = now.getDay();
                startDate = new Date(now);
                startDate.setDate(now.getDate() - dayOfWeek);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;

            case "daily":
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;

            default:
                throw new Error("Invalid period");
        }

        return { startDate, endDate };
    }

    static async findExistingBudget(
        prisma,
        phoneNumber,
        category,
        period,
        startDate
    ) {
        return await prisma.budget.findFirst({
            where: {
                userId: phoneNumber,
                category: category,
                period: period,
                startDate: startDate,
                isActive: true,
            },
        });
    }

    static async calculateBudgetStatus(prisma, phoneNumber, budget) {
        const expenses = await prisma.expense.findMany({
            where: {
                userId: phoneNumber,
                category: {
                    contains: budget.category,
                    mode: "insensitive",
                },
                createdAt: {
                    gte: budget.startDate,
                    lte: budget.endDate,
                },
            },
        });

        const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remaining = budget.amount - spent;
        const percentage = (spent / budget.amount) * 100;

        return { spent, remaining, percentage, expenseCount: expenses.length };
    }

    static generateAlertIfNeeded(budget, statusData) {
        const { spent, percentage } = statusData;

        if (percentage >= 100) {
            return `🚨 *BUDGET EXCEEDED!*\n\n🏷️ ${
                budget.category
            }\n💰 Budget: ₹${this.formatCurrency(
                budget.amount
            )}\n💸 Spent: ₹${this.formatCurrency(spent)} (${percentage.toFixed(
                1
            )}%)\n📅 Period: ${
                budget.period
            }\n\n⚠️ You've exceeded your budget!`;
        } else if (percentage >= budget.alertThreshold * 100) {
            return `⚠️ *BUDGET ALERT!*\n\n🏷️ ${
                budget.category
            }\n💰 Budget: ₹${this.formatCurrency(
                budget.amount
            )}\n💸 Spent: ₹${this.formatCurrency(spent)} (${percentage.toFixed(
                1
            )}%)\n📅 Period: ${budget.period}\n\n🎯 Approaching your limit!`;
        }

        return null;
    }

    static formatBudgetResponse(action, data) {
        const { category, amount, period, alertAmount } = data;
        const actionText =
            action === "created" ? "Budget Set!" : "Budget Updated!";

        return `✅ *${actionText}*\n\n🏷️ Category: ${category}\n💰 Amount: ₹${this.formatCurrency(
            amount
        )}\n📅 Period: ${period}\n⏰ Alert at: 80% (₹${this.formatCurrency(
            alertAmount
        )})\n\nI'll keep track for you! 🎯`;
    }

    static formatBudgetStatus(budget, statusData) {
        const { spent, remaining, percentage } = statusData;
        const status =
            percentage >= 100 ? "🔴" : percentage >= 80 ? "🟡" : "🟢";

        return `${status} *${
            budget.category
        }*\n💰 Budget: ₹${this.formatCurrency(
            budget.amount
        )}\n💸 Spent: ₹${this.formatCurrency(spent)} (${percentage.toFixed(
            1
        )}%)\n💵 Remaining: ₹${this.formatCurrency(remaining)}\n📅 Period: ${
            budget.period
        }\n\n`;
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
        }).format(amount);
    }

    static getBudgetExamples() {
        return `*Examples:*\n• "Set budget for food as 5000 this month"\n• "Set travel budget 3000 monthly"\n• "Budget 2000 for shopping weekly"`;
    }

    static getBudgetHelpMessage() {
        return `💰 *Budget Help*\n\n${this.getBudgetExamples()}\n\n*Commands:*\n• 'budget status' - View all budgets\n• 'list budgets' - List your budgets`;
    }
}

module.exports = BudgetManager;
