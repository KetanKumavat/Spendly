class SpendlyBot {
    static getWelcomeMessage(isNewUser = false) {
        if (isNewUser) {
            return `🎉 *Welcome to Spendly!*

Hi there! I'm your personal expense tracking assistant. I'll help you track every rupee you spend effortlessly.

*Here's what I can do:*
📝 *Text tracking:* Send me messages like "50rs coffee at CCD" or "paid 500 to grocery store"
📷 *Bill scanning:* Send me photos of bills/receipts and I'll extract all details automatically
📊 *Smart categorization:* I'll automatically categorize your expenses

*Try it now!* Send me your first expense or a bill photo.

Type 'help' anytime for more options! 💪`;
        } else {
            return `👋 *Welcome back!*

Ready to track more expenses? Send me:
• A text like "100rs lunch at office canteen"
• A photo of your bill/receipt
• Type 'help' for all commands`;
        }
    }

    static getHelpMessage() {
        return `🔧 *Spendly Commands:*

*Expense Tracking:*
• Send text: "50rs coffee" or "paid 200 to uber"
• Send bill photo for auto-extraction

*Quick Commands:*
• \`summary\` - View your expense summary
• \`today\` - Today's expenses
• \`week\` - This week's expenses
• \`categories\` - Expense breakdown by category
• \`help\` - Show this menu

*Pro Tips:*
💡 Include vendor name for better tracking
💡 I understand various formats like "rs", "rupees", "₹"
💡 Send clear photos for accurate bill scanning

What would you like to track today? 📊`;
    }

    static getErrorMessage(error = "general") {
        const messages = {
            general:
                "❌ Oops! Something went wrong. Please try again or contact support.",
            parsing: `❌ *Couldn't understand that expense*

*Try these formats:*
• "50rs coffee at cafe"
• "paid 200 to grocery store"
• "300 rupees dinner"
• Or send a clear bill photo

Need help? Type 'help' 💪`,
            image: "❌ Please send a clear image of your bill or receipt. I can extract all the details automatically! 📷",
        };
        return messages[error] || messages.general;
    }

    static getSuccessMessage(expenseData, isImage = false) {
        const amount = expenseData.total || 0;
        const vendor = expenseData.vendor || "item";
        const date = expenseData.date || "today";

        if (isImage) {
            return `✅ *Bill processed successfully!*

💰 *Amount:* ₹${amount}
🏪 *Vendor:* ${vendor}
📅 *Date:* ${date}

Your expense has been saved automatically! 🎉

Send another expense or type 'summary' to see your spending overview.`;
        } else {
            return `✅ *Expense saved!*

₹${amount} spent at ${vendor} on ${date}

Keep tracking! Send another expense or type 'help' for more options. 📊`;
        }
    }

    static getProcessingMessage(isImage = false) {
        if (isImage) {
            return "🔍 *Processing your bill...*\n\nI'm extracting all the details from your receipt. This will take a few seconds! ⏳";
        } else {
            return "⏳ Processing your expense...";
        }
    }

    static isCommand(text) {
        const commands = [
            "help",
            "summary",
            "today",
            "week",
            "categories",
            "start",
            "hi",
            "hello",
            "hey",
        ];
        return commands.includes(text.toLowerCase().trim());
    }

    static async handleCommand(command, phoneNumber, prisma) {
        const cmd = command.toLowerCase().trim();

        switch (cmd) {
            case "help":
                return this.getHelpMessage();

            case "summary":
                return await this.getSummaryMessage(phoneNumber, prisma);

            case "today":
                return await this.getTodayExpenses(phoneNumber, prisma);

            case "week":
                return await this.getWeekExpenses(phoneNumber, prisma);

            case "categories":
                return await this.getCategoryBreakdown(phoneNumber, prisma);

            case "start":
            case "hi":
            case "hello":
            case "hey":
                // Check if user exists to determine welcome message
                const user = await prisma.user.findUnique({
                    where: { id: phoneNumber },
                });
                return this.getWelcomeMessage(!user);

            default:
                return this.getHelpMessage();
        }
    }

    static async getSummaryMessage(phoneNumber, prisma) {
        try {
            const expenses = await prisma.expense.findMany({
                where: { userId: phoneNumber },
                orderBy: { createdAt: "desc" },
                take: 10,
            });

            if (expenses.length === 0) {
                return `📊 *Your Expense Summary*

No expenses tracked yet! Start by sending me your first expense:
• Text: "50rs coffee at cafe"
• Or send a bill photo 📷

Let's start tracking! 💪`;
            }

            const totalAmount = expenses.reduce(
                (sum, exp) => sum + exp.amount,
                0
            );
            const todayExpenses = expenses.filter((exp) => {
                const today = new Date();
                const expDate = new Date(exp.createdAt);
                return expDate.toDateString() === today.toDateString();
            });
            const todayTotal = todayExpenses.reduce(
                (sum, exp) => sum + exp.amount,
                0
            );

            return `📊 *Your Expense Summary*

💰 *Total Expenses:* ₹${totalAmount.toFixed(2)}
📅 *Today's Spending:* ₹${todayTotal.toFixed(2)}
📈 *Total Entries:* ${expenses.length}

*Recent Expenses:*
${expenses
    .slice(0, 5)
    .map(
        (exp) =>
            `• ₹${exp.amount} - ${
                exp.description?.split("|")[0]?.replace("Vendor: ", "") ||
                "Unknown"
            }`
    )
    .join("\n")}

Type 'categories' for breakdown or keep tracking! 🚀`;
        } catch (error) {
            console.error("Summary error:", error);
            return this.getErrorMessage();
        }
    }

    static async getTodayExpenses(phoneNumber, prisma) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const expenses = await prisma.expense.findMany({
                where: {
                    userId: phoneNumber,
                    createdAt: {
                        gte: today,
                        lt: tomorrow,
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            if (expenses.length === 0) {
                return `📅 *Today's Expenses*

No expenses tracked today yet!

Start tracking:
• "50rs coffee"
• Send a bill photo 📷`;
            }

            const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

            return `📅 *Today's Expenses (${new Date().toLocaleDateString()})*

💰 *Total:* ₹${total.toFixed(2)}
📊 *Entries:* ${expenses.length}

${expenses
    .map(
        (exp) =>
            `• ₹${exp.amount} - ${
                exp.description?.split("|")[0]?.replace("Vendor: ", "") ||
                "Unknown"
            }`
    )
    .join("\n")}

Keep it up! 🎯`;
        } catch (error) {
            console.error("Today expenses error:", error);
            return this.getErrorMessage();
        }
    }

    static async getWeekExpenses(phoneNumber, prisma) {
        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const expenses = await prisma.expense.findMany({
                where: {
                    userId: phoneNumber,
                    createdAt: { gte: weekAgo },
                },
                orderBy: { createdAt: "desc" },
            });

            if (expenses.length === 0) {
                return `📊 *This Week's Expenses*

No expenses this week yet!

Start tracking your spending! 💪`;
            }

            const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const avgDaily = (total / 7).toFixed(2);

            return `📊 *This Week's Expenses*

💰 *Total:* ₹${total.toFixed(2)}
📈 *Daily Average:* ₹${avgDaily}
📊 *Entries:* ${expenses.length}

*Top Expenses:*
${expenses
    .slice(0, 5)
    .map(
        (exp) =>
            `• ₹${exp.amount} - ${
                exp.description?.split("|")[0]?.replace("Vendor: ", "") ||
                "Unknown"
            }`
    )
    .join("\n")}

Type 'categories' for detailed breakdown! 📈`;
        } catch (error) {
            console.error("Week expenses error:", error);
            return this.getErrorMessage();
        }
    }

    static async getCategoryBreakdown(phoneNumber, prisma) {
        try {
            const expenses = await prisma.expense.findMany({
                where: { userId: phoneNumber },
                select: { amount: true, category: true },
            });

            if (expenses.length === 0) {
                return `📊 *Category Breakdown*

No expenses to categorize yet!

Start tracking to see your spending patterns! 🎯`;
            }

            const categoryTotals = {};
            expenses.forEach((exp) => {
                const cat = exp.category || "Uncategorized";
                categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
            });

            const total = Object.values(categoryTotals).reduce(
                (sum, amount) => sum + amount,
                0
            );
            const sortedCategories = Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8);

            return `📊 *Category Breakdown*

💰 *Total Spending:* ₹${total.toFixed(2)}

${sortedCategories
    .map(([category, amount]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        return `• ${category}: ₹${amount.toFixed(2)} (${percentage}%)`;
    })
    .join("\n")}

Keep tracking to optimize your spending! 🎯`;
        } catch (error) {
            console.error("Category breakdown error:", error);
            return this.getErrorMessage();
        }
    }
}

module.exports = SpendlyBot;
