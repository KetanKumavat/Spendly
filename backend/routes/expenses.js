const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
    try {
        const { phone, userId } = req.query;
        const userPhone = phone || userId;

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
