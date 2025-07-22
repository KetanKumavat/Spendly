const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearDatabase() {
    try {
        console.log("🗑️  Clearing database...");

        console.log("Deleting expenses...");
        await prisma.expense.deleteMany({});

        console.log("Deleting budgets...");
        await prisma.budget.deleteMany({});

        console.log("Deleting sessions...");
        await prisma.session.deleteMany({});

        console.log("Deleting users...");
        await prisma.user.deleteMany({});

        console.log("Database cleared successfully!");

        const userCount = await prisma.user.count();
        const expenseCount = await prisma.expense.count();
        const budgetCount = await prisma.budget.count();
        const sessionCount = await prisma.session.count();

        console.log("📊 Final counts:");
        console.log(`Users: ${userCount}`);
        console.log(`Expenses: ${expenseCount}`);
        console.log(`Budgets: ${budgetCount}`);
        console.log(`Sessions: ${sessionCount}`);
    } catch (error) {
        console.error("Error clearing database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

clearDatabase();
