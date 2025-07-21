const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get expenses for a user
router.get("/", async (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({ error: "Phone number required" });
        }

        const expenses = await prisma.expense.findMany({
            where: {
                userId: phone,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 100, // Limit to latest 100 expenses
        });

        return res.json(expenses);
    } catch (error) {
        console.error("Get expenses error:", error);
        return res.status(500).json({ error: "Failed to fetch expenses" });
    }
});

// Get monthly stats for a user
router.get("/stats", async (req, res) => {
    try {
        const { phone } = req.query;

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

        // Get monthly expenses
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

        // Calculate stats
        const totalAmount = monthlyExpenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
        );
        const totalExpenses = monthlyExpenses.length;

        // Category breakdown
        const categories = {};
        monthlyExpenses.forEach((expense) => {
            categories[expense.category] =
                (categories[expense.category] || 0) + expense.amount;
        });

        // Daily spending for the month
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
