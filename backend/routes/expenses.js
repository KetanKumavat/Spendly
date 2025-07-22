const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// rate limiter for export functionality
const exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2,
    message: {
        error: "Too many export requests, please try again in an hour.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.get("/", apiLimiter, async (req, res) => {
    try {
        const { phone, userId } = req.query;
        let userPhone = phone || userId;

        if (userPhone && userPhone.startsWith(" ")) {
            userPhone = "+" + userPhone.trim();
        }

        // console.log("Expenses API called with:", { phone, userId, userPhone });

        if (!userPhone) {
            return res
                .status(400)
                .json({ error: "Phone number or user ID required" });
        }

        const expenses = await prisma.expense.findMany({
            where: {
                userId: userPhone,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100,
        });

        // console.log(`Found ${expenses.length} expenses for user ${userPhone}`);

        const transformedExpenses = expenses.map((expense) => ({
            id: expense.id,
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            source: expense.source,
            createdAt: expense.createdAt.toISOString(),
            rawText: expense.rawText,
            imageUrl: expense.imageUrl,
        }));

        return res.json(transformedExpenses);
    } catch (error) {
        console.error("Get expenses error:", error);
        return res.status(500).json({ error: "Failed to fetch expenses" });
    }
});

router.get("/export", exportLimiter, async (req, res) => {
    try {
        const { phone, userId, format = "csv" } = req.query;
        let userPhone = phone || userId;

        if (userPhone && userPhone.startsWith(" ")) {
            userPhone = "+" + userPhone.trim();
        }

        if (!userPhone) {
            return res
                .status(400)
                .json({ error: "Phone number or user ID required" });
        }

        const expenses = await prisma.expense.findMany({
            where: {
                userId: userPhone,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (format.toLowerCase() === "csv") {
            const csvHeader =
                "Date,Amount,Category,Description,Source,Raw Text\n";
            const csvRows = expenses
                .map((expense) => {
                    const date = new Date(
                        expense.createdAt
                    ).toLocaleDateString();
                    const description = (expense.description || "").replace(
                        /"/g,
                        '""'
                    );
                    const rawText = (expense.rawText || "").replace(/"/g, '""');
                    return `"${date}","${expense.amount}","${expense.category}","${description}","${expense.source}","${rawText}"`;
                })
                .join("\n");

            const csvContent = csvHeader + csvRows;

            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="spendly-expenses-${
                    new Date().toISOString().split("T")[0]
                }.csv"`
            );
            return res.send(csvContent);
        } else {
            res.setHeader("Content-Type", "application/json");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="spendly-expenses-${
                    new Date().toISOString().split("T")[0]
                }.json"`
            );
            return res.json({
                exportDate: new Date().toISOString(),
                totalExpenses: expenses.length,
                totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
                expenses: expenses,
            });
        }
    } catch (error) {
        console.error("Export expenses error:", error);
        return res.status(500).json({ error: "Failed to export expenses" });
    }
});

router.get("/stats", apiLimiter, async (req, res) => {
    try {
        let { phone } = req.query;

        if (phone && phone.startsWith(" ")) {
            phone = "+" + phone.trim();
        }

        if (!phone) {
            return res.status(400).json({ error: "Phone number required" });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
        );

        const monthlyExpenses = await prisma.expense.findMany({
            where: {
                userId: phone,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const totalAmount = monthlyExpenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
        );
        const totalExpenses = monthlyExpenses.length;

        const categories = {};
        monthlyExpenses.forEach((expense) => {
            categories[expense.category] =
                (categories[expense.category] || 0) + expense.amount;
        });

        const dailySpending = {};
        monthlyExpenses.forEach((expense) => {
            const date = expense.createdAt.toISOString().split("T")[0];
            dailySpending[date] = (dailySpending[date] || 0) + expense.amount;
        });

        const dailySpendingArray = Object.entries(dailySpending)
            .map(([date, amount]) => ({
                date,
                amount,
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const stats = {
            totalAmount,
            totalExpenses,
            categories,
            dailySpending: dailySpendingArray,
        };

        return res.json(stats);
    } catch (error) {
        console.error("Get stats error:", error);
        return res.status(500).json({ error: "Failed to fetch stats" });
    }
});

module.exports = router;
