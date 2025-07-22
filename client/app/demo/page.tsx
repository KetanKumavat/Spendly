"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/utils";
import Link from "next/link";

// Demo data
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
        imageUrl: "/demo-receipt.jpg",
    },
    {
        id: "4",
        amount: 500,
        category: "Entertainment",
        description: "Vendor: BookMyShow | Date: Yesterday",
        source: "whatsapp" as const,
        createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
        rawText: "Movie tickets 500rs",
    },
    {
        id: "5",
        amount: 300,
        category: "Shopping",
        description: "Vendor: Amazon | Date: 2 days ago",
        source: "whatsapp" as const,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        rawText: "Amazon purchase 300rs",
    },
];

const categoryStats = {
    "Food & Dining": 1850,
    Transportation: 650,
    Groceries: 2400,
    Entertainment: 1200,
    Shopping: 800,
};

const budgets = [
    { category: "Food & Dining", budget: 5000, spent: 1850, color: "red" },
    { category: "Transportation", budget: 2000, spent: 650, color: "blue" },
    { category: "Groceries", budget: 4000, spent: 2400, color: "green" },
];

export default function DemoPage() {
    const totalSpent = Object.values(categoryStats).reduce(
        (sum, amount) => sum + amount,
        0
    );
    const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);

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
                                    Demo Dashboard
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Interactive expense tracking preview
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 border-blue-200/50"
                        >
                            📊 Demo Mode
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
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
                                        Budget Left
                                    </p>
                                    <p className="text-2xl font-bold text-green-900">
                                        {formatCurrency(
                                            totalBudget - totalSpent
                                        )}
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
                                        Categories
                                    </p>
                                    <p className="text-2xl font-bold text-purple-900">
                                        {Object.keys(categoryStats).length}
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
                                        {demoExpenses.length}
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
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm">
                                            <Filter className="w-4 h-4 mr-2" />
                                            Filter
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {demoExpenses.map((expense, idx) => (
                                        <motion.div
                                            key={expense.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
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
                                                        <MapPin className="w-5 h-5 text-green-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {expense.description
                                                            .split("|")[0]
                                                            .replace(
                                                                "Vendor: ",
                                                                ""
                                                            )}
                                                    </p>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            className={getCategoryColor(
                                                                expense.category
                                                            )}
                                                            variant="secondary"
                                                        >
                                                            {expense.category}
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
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Category Breakdown & Budgets */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* Category Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">
                                    Category Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(categoryStats).map(
                                        ([category, amount]) => {
                                            const percentage =
                                                (amount / totalSpent) * 100;
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
                                                        {percentage.toFixed(1)}%
                                                        of total
                                                    </p>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Budget Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">
                                    Budget Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {budgets.map((budget) => {
                                        const percentage =
                                            (budget.spent / budget.budget) *
                                            100;
                                        const isOverBudget = percentage > 100;
                                        return (
                                            <div
                                                key={budget.category}
                                                className="space-y-2"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {budget.category}
                                                    </span>
                                                    <span
                                                        className={`text-sm font-bold ${
                                                            isOverBudget
                                                                ? "text-red-600"
                                                                : "text-gray-900"
                                                        }`}
                                                    >
                                                        {formatCurrency(
                                                            budget.spent
                                                        )}{" "}
                                                        /{" "}
                                                        {formatCurrency(
                                                            budget.budget
                                                        )}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={Math.min(
                                                        percentage,
                                                        100
                                                    )}
                                                    className={`h-2 ${
                                                        isOverBudget
                                                            ? "bg-red-100"
                                                            : ""
                                                    }`}
                                                />
                                                <div className="flex justify-between items-center">
                                                    <span
                                                        className={`text-xs ${
                                                            isOverBudget
                                                                ? "text-red-600"
                                                                : "text-gray-500"
                                                        }`}
                                                    >
                                                        {percentage.toFixed(1)}%
                                                        used
                                                    </span>
                                                    {isOverBudget && (
                                                        <Badge
                                                            variant="destructive"
                                                            className="text-xs"
                                                        >
                                                            Over budget!
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center"
                >
                    <h3 className="text-2xl font-bold mb-4">
                        Ready to track your real expenses?
                    </h3>
                    <p className="text-lg opacity-90 mb-6">
                        This is just a preview. Start tracking your actual
                        expenses via WhatsApp!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            variant="secondary"
                            onClick={() =>
                                window.open(
                                    "https://wa.me/14155238886?text=join%20%hold-seed",
                                    "_blank"
                                )
                            }
                        >
                            Start on WhatsApp
                        </Button>
                        <Link href="/">
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-white/30 border-2 text-white bg-transparent hover:bg-white/10"
                            >
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
