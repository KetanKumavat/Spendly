"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    TrendingUp,
    PieChart,
    CreditCard,
    MapPin,
    Clock,
    Download,
    Filter,
    Camera,
    Loader2,
    AlertCircle,
    User,
    LogOut,
    BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/utils";
import Link from "next/link";

interface User {
    id: string;
    phoneNumber: string;
    name: string;
}

interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    source: "whatsapp" | "image";
    createdAt: string;
    rawText?: string;
    imageUrl?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<User | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setError("No authentication token provided");
            setLoading(false);
            return;
        }

        verifyToken(token);
    }, [searchParams]);

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch("/api/auth/verify-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });

            if (!response.ok) {
                throw new Error("Invalid or expired token");
            }

            const userData = await response.json();
            setUser(userData);

            // Store token in localStorage for session management
            localStorage.setItem("auth_token", token);

            // Fetch user expenses
            await fetchExpenses(userData.phoneNumber);
        } catch (err) {
            console.error("Token verification failed:", err);
            setError(
                "Invalid or expired login link. Please request a new one from WhatsApp."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenses = async (phoneNumber: string) => {
        try {
            const token = localStorage.getItem("auth_token");
            const response = await fetch(
                `/api/expenses?userId=${phoneNumber}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setExpenses(data);
            }
        } catch (err) {
            console.error("Failed to fetch expenses:", err);
            // Don't set error here as we'll show demo data instead
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("auth_token");
        router.push("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
                    <p className="text-gray-600">Verifying your login...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Authentication Error
                            </h2>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <div className="space-y-3">
                                <p className="text-sm text-gray-500">
                                    To get a new login link, send "login" or
                                    "dashboard" to your Spendly WhatsApp bot.
                                </p>
                                <Link href="/">
                                    <Button className="w-full">
                                        Back to Home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Demo data for when no expenses are fetched
    const demoExpenses = [
        {
            id: "1",
            amount: 250,
            category: "Food & Dining",
            description: "Vendor: Zomato | Date: Today",
            source: "whatsapp" as const,
            createdAt: new Date().toISOString(),
            rawText: "Paid 250rs for Zomato lunch",
        },
        {
            id: "2",
            amount: 150,
            category: "Transportation",
            description: "Vendor: Uber | Date: Today",
            source: "whatsapp" as const,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            rawText: "Uber ride 150rs",
        },
        {
            id: "3",
            amount: 1200,
            category: "Groceries",
            description: "Vendor: BigBasket | Date: Yesterday",
            source: "image" as const,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    const displayExpenses = expenses.length > 0 ? expenses : demoExpenses;

    // Calculate statistics
    const totalSpent = displayExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
    );
    const todaySpent = displayExpenses
        .filter((expense) => {
            const expenseDate = new Date(expense.createdAt);
            const today = new Date();
            return expenseDate.toDateString() === today.toDateString();
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

    const categoryTotals = displayExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals).sort(
        ([, a], [, b]) => b - a
    )[0];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/80">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href="/">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Home
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Your Dashboard
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Welcome back, {user?.name || "User"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {expenses.length === 0 && (
                                <Badge
                                    variant="secondary"
                                    className="bg-orange-50 text-orange-700 border-orange-200/50"
                                >
                                    📊 Demo Data
                                </Badge>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {expenses.length === 0 && (
                    <Alert className="mb-8 bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            No expenses tracked yet! Start by sending your
                            expenses to the WhatsApp bot. The data shown below
                            is demo data to preview the dashboard functionality.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
                >
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-600 text-sm font-medium">
                                        Total Spent
                                    </p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {formatCurrency(totalSpent)}
                                    </p>
                                </div>
                                <CreditCard className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-600 text-sm font-medium">
                                        Today
                                    </p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {formatCurrency(todaySpent)}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-600 text-sm font-medium">
                                        Top Category
                                    </p>
                                    <p className="text-2xl font-bold text-purple-900">
                                        {topCategory?.[0] || "None"}
                                    </p>
                                </div>
                                <PieChart className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-600 text-sm font-medium">
                                        Transactions
                                    </p>
                                    <p className="text-2xl font-bold text-orange-900">
                                        {displayExpenses.length}
                                    </p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Category Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <PieChart className="w-5 h-5 mr-2" />
                                Spending by Category
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(categoryTotals)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([category, amount]) => {
                                        const percentage =
                                            (amount / totalSpent) * 100;
                                        return (
                                            <div
                                                key={category}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <div
                                                        className={`w-4 h-4 rounded-full ${getCategoryColor(
                                                            category
                                                        )}`}
                                                    />
                                                    <span className="font-medium">
                                                        {category}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-24">
                                                        <Progress
                                                            value={percentage}
                                                            className="h-2"
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-600 min-w-[60px] text-right">
                                                        {formatCurrency(amount)}
                                                    </span>
                                                    <span className="text-xs text-gray-400 min-w-[40px] text-right">
                                                        {percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Transactions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center">
                                <Clock className="w-5 h-5 mr-2" />
                                Recent Transactions
                            </CardTitle>
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {displayExpenses
                                    .sort(
                                        (a, b) =>
                                            new Date(b.createdAt).getTime() -
                                            new Date(a.createdAt).getTime()
                                    )
                                    .map((expense) => (
                                        <div
                                            key={expense.id}
                                            className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="p-2 rounded-lg bg-gray-100">
                                                    {expense.source ===
                                                    "image" ? (
                                                        <Camera className="w-4 h-4 text-gray-600" />
                                                    ) : (
                                                        <CreditCard className="w-4 h-4 text-gray-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {formatCurrency(
                                                            expense.amount
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {expense.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-gray-100 text-gray-700"
                                                >
                                                    {expense.category}
                                                </Badge>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(
                                                        expense.createdAt
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8"
                >
                    <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                        <CardContent className="p-8 text-center">
                            <h3 className="text-2xl font-bold mb-2">
                                Continue Tracking with WhatsApp
                            </h3>
                            <p className="text-blue-100 mb-6">
                                Send your expenses directly to WhatsApp and
                                watch them appear here automatically!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <div className="text-left">
                                    <p className="text-sm font-medium text-blue-100">
                                        💸 Send text: "50rs coffee at CCD"
                                    </p>
                                    <p className="text-sm font-medium text-blue-100">
                                        📷 Send bill photos for auto-extraction
                                    </p>
                                    <p className="text-sm font-medium text-blue-100">
                                        📊 Type "summary" for quick analytics
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
