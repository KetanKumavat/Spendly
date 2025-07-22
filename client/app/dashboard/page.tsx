"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    PieChart,
    CreditCard,
    Clock,
    Download,
    Camera,
    Loader2,
    AlertCircle,
    User,
    LogOut,
    TrendingUp,
    MessageCircle,
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

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<User | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exportLoading, setExportLoading] = useState(false);

    const handleExport = async (format: "csv" | "json" = "csv") => {
        if (!user) return;

        setExportLoading(true);
        try {
            const token = sessionStorage.getItem("auth_token");
            const response = await fetch(
                `/api/expenses/export?userId=${encodeURIComponent(
                    user.phoneNumber
                )}&format=${format}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Export failed");
            }

            const contentDisposition = response.headers.get(
                "content-disposition"
            );
            const filename = contentDisposition
                ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
                : `expenses_${
                      new Date().toISOString().split("T")[0]
                  }.${format}`;

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Export failed:", err);
            setError("Failed to export data. Please try again.");
        } finally {
            setExportLoading(false);
        }
    };

    const fetchExpenses = useCallback(async (userId: string) => {
        try {
            const token = sessionStorage.getItem("auth_token");
            const response = await fetch(`/api/expenses?userId=${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setExpenses(data);
            }
        } catch (err) {
            console.error("Failed to fetch expenses:", err);
        }
    }, []);

    const verifyToken = useCallback(
        async (token: string) => {
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

                sessionStorage.setItem("auth_token", token);
                window.history.replaceState({}, document.title, "/dashboard");

                await fetchExpenses(userData.phoneNumber);
            } catch (err) {
                console.error("Token verification failed:", err);
                setError(
                    "Invalid or expired login link. Please request a new one from WhatsApp."
                );
            } finally {
                setLoading(false);
            }
        },
        [fetchExpenses]
    );

    useEffect(() => {
        const token = searchParams.get("token");

        const storedToken = sessionStorage.getItem("auth_token");

        if (token) {
            verifyToken(token);
        } else if (storedToken) {
            verifyToken(storedToken);
        } else {
            setError("No authentication token provided");
            setLoading(false);
        }
    }, [searchParams, verifyToken]);

    const handleLogout = () => {
        sessionStorage.removeItem("auth_token");
        setUser(null);
        setExpenses([]);
        router.push("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
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
                                    To get a new login link, send
                                    &quot;login&quot; or &quot;dashboard&quot;
                                    to your Spendly WhatsApp bot.
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

    const displayExpenses = expenses;

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Header */}
            <div className="border-b border-gray-200/50 sticky top-0 z-40 backdrop-blur-lg bg-white/80">
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
                                    Expense Dashboard
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Welcome back, {user?.name || "User"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="p-2 bg-green-100 rounded-full">
                                    <User className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                    {user?.name}
                                </span>
                            </div>
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
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {expenses.length === 0 && (
                    <Alert className="mb-8 bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            No expenses tracked yet! Start by sending your
                            expenses to the WhatsApp bot to see your data here.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
                >
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">
                                        Total Spent
                                    </p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {formatCurrency(totalSpent)}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-500 rounded-full">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">
                                        Today
                                    </p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {formatCurrency(todaySpent)}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-500 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-600">
                                        Top Category
                                    </p>
                                    <p className="text-2xl font-bold text-purple-900">
                                        {topCategory?.[0] || "None"}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-500 rounded-full">
                                    <PieChart className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-orange-600">
                                        Transactions
                                    </p>
                                    <p className="text-2xl font-bold text-orange-900">
                                        {displayExpenses.length}
                                    </p>
                                </div>
                                <div className="p-3 bg-orange-500 rounded-full">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Expenses */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2"
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold">
                                        Recent Expenses
                                    </CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleExport("csv")}
                                        disabled={
                                            exportLoading ||
                                            displayExpenses.length === 0
                                        }
                                    >
                                        {exportLoading ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4 mr-2" />
                                        )}
                                        Export CSV
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {displayExpenses.length > 0 ? (
                                    <div className="space-y-4">
                                        {displayExpenses
                                            .slice(0, 10)
                                            .map((expense, idx) => (
                                                <motion.div
                                                    key={expense.id}
                                                    initial={{
                                                        opacity: 0,
                                                        y: 10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    transition={{
                                                        delay: idx * 0.1,
                                                    }}
                                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div
                                                            className={`p-2 rounded-lg ${
                                                                expense.source ===
                                                                "image"
                                                                    ? "bg-blue-100"
                                                                    : "bg-green-100"
                                                            }`}
                                                        >
                                                            {expense.source ===
                                                            "image" ? (
                                                                <Camera className="w-5 h-5 text-blue-600" />
                                                            ) : (
                                                                <CreditCard className="w-5 h-5 text-green-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {expense.description ||
                                                                    expense.rawText ||
                                                                    "Expense"}
                                                            </p>
                                                            <div className="flex items-center space-x-2">
                                                                <Badge
                                                                    className={getCategoryColor(
                                                                        expense.category
                                                                    )}
                                                                    variant="secondary"
                                                                >
                                                                    {
                                                                        expense.category
                                                                    }
                                                                </Badge>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatDate(
                                                                        expense.createdAt
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {formatCurrency(
                                                                expense.amount
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500 capitalize">
                                                            {expense.source}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            No transactions yet
                                        </h3>
                                        <p className="text-gray-500 mb-4">
                                            Start tracking your expenses by
                                            sending them to WhatsApp
                                        </p>
                                        <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                                            <p className="text-sm text-gray-600 mb-2 font-medium">
                                                💡 Try sending:
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                • "50rs coffee at Starbucks"
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                • "1200 groceries"
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                • Upload a photo of your bill
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Category Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">
                                    Category Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {Object.entries(categoryTotals).length > 0 ? (
                                    <div className="space-y-4">
                                        {Object.entries(categoryTotals)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([category, amount]) => {
                                                const percentage =
                                                    totalSpent > 0
                                                        ? (amount /
                                                              totalSpent) *
                                                          100
                                                        : 0;
                                                return (
                                                    <div key={category}>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {category}
                                                            </span>
                                                            <span className="text-sm font-bold text-gray-900">
                                                                {formatCurrency(
                                                                    amount
                                                                )}
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={percentage}
                                                            className="h-2"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {percentage.toFixed(
                                                                1
                                                            )}
                                                            % of total
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <h4 className="font-medium text-gray-900 mb-1">
                                            No categories yet
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            Categories will appear here after
                                            you add expenses
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-12"
                >
                    <Card className="relative overflow-hidden border-0 shadow-2xl">
                        {/* Background with animated gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600 opacity-90"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                        {/* Floating shapes for visual interest */}
                        <div className="absolute top-4 right-8 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-8 left-8 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
                        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/5 rounded-full blur-md"></div>

                        <CardContent className="relative p-8 md:p-12">
                            <div className="max-w-4xl mx-auto">
                                <div className="text-center mb-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            delay: 0.5,
                                            type: "spring",
                                            stiffness: 200,
                                        }}
                                        className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm"
                                    >
                                        <MessageCircle className="w-8 h-8 text-white" />
                                    </motion.div>
                                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                                        Keep the Momentum Going!
                                    </h3>
                                    <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
                                        Your expense tracking journey doesn't
                                        stop here. Send expenses directly to
                                        WhatsApp and watch your financial
                                        insights grow automatically.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-3 gap-6 mb-8">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                                    >
                                        <div className="flex items-center mb-3">
                                            <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center mr-3">
                                                <span className="text-2xl">
                                                    💬
                                                </span>
                                            </div>
                                            <h4 className="font-semibold text-white">
                                                Quick Text
                                            </h4>
                                        </div>
                                        <p className="text-sm text-white/80 mb-2">
                                            Simply type and send:
                                        </p>
                                        <code className="text-xs bg-black/20 text-green-200 px-2 py-1 rounded font-mono">
                                            "50rs coffee at CCD"
                                        </code>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7 }}
                                        className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                                    >
                                        <div className="flex items-center mb-3">
                                            <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center mr-3">
                                                <Camera className="w-5 h-5 text-blue-200" />
                                            </div>
                                            <h4 className="font-semibold text-white">
                                                Photo Bills
                                            </h4>
                                        </div>
                                        <p className="text-sm text-white/80 mb-2">
                                            Upload receipts for:
                                        </p>
                                        <p className="text-xs text-blue-200">
                                            Automatic text extraction &
                                            categorization
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 }}
                                        className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                                    >
                                        <div className="flex items-center mb-3">
                                            <div className="w-10 h-10 bg-purple-400/20 rounded-lg flex items-center justify-center mr-3">
                                                <span className="text-2xl">
                                                    📊
                                                </span>
                                            </div>
                                            <h4 className="font-semibold text-white">
                                                Instant Analytics
                                            </h4>
                                        </div>
                                        <p className="text-sm text-white/80 mb-2">
                                            Type commands like:
                                        </p>
                                        <code className="text-xs bg-black/20 text-purple-200 px-2 py-1 rounded font-mono">
                                            "summary" or "help"
                                        </code>
                                    </motion.div>
                                </div>

                                <div className="text-center">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.9 }}
                                        className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20"
                                    >
                                        <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                                        <span className="text-sm text-white/90 font-medium">
                                            🔗 Connected via WhatsApp •
                                            Real-time sync enabled
                                        </span>
                                    </motion.div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            }
        >
            <DashboardContent />
        </Suspense>
    );
}
