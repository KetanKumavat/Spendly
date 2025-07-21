const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    source: "whatsapp" | "text" | "image";
    imageUrl?: string;
    createdAt: string;
    rawText?: string;
    structuredData?: unknown;
}

export interface User {
    id: string;
    name: string;
    phoneNumber: string;
    createdAt: string;
}

export class ApiService {
    static async verifyToken(
        token: string
    ): Promise<{ user: User; valid: boolean }> {
        const response = await fetch(`${API_BASE}/auth/verify-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            throw new Error("Token verification failed");
        }

        return response.json();
    }

    static async getExpenses(phoneNumber: string): Promise<Expense[]> {
        const response = await fetch(
            `${API_BASE}/expenses?phone=${encodeURIComponent(phoneNumber)}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch expenses");
        }

        return response.json();
    }

    static async getExpenseStats(phoneNumber: string) {
        const expenses = await this.getExpenses(phoneNumber);

        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const monthlyExpenses = expenses.filter(
            (e) => new Date(e.createdAt) >= thisMonth
        );
        const weeklyExpenses = expenses.filter(
            (e) => new Date(e.createdAt) >= thisWeek
        );

        const totalSpent = monthlyExpenses.reduce(
            (sum, e) => sum + e.amount,
            0
        );
        const weeklySpent = weeklyExpenses.reduce(
            (sum, e) => sum + e.amount,
            0
        );

        // Category breakdown
        const categoryStats = monthlyExpenses.reduce((acc, expense) => {
            const category = expense.category;
            acc[category] = (acc[category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalSpent,
            weeklySpent,
            monthlyCount: monthlyExpenses.length,
            weeklyCount: weeklyExpenses.length,
            categoryStats,
            recentExpenses: expenses.slice(0, 10),
        };
    }
}
