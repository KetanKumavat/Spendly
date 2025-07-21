import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
};

export const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
        "Food & Dining": "bg-red-100 text-red-800",
        Transportation: "bg-blue-100 text-blue-800",
        Shopping: "bg-purple-100 text-purple-800",
        Groceries: "bg-green-100 text-green-800",
        Entertainment: "bg-yellow-100 text-yellow-800",
        Healthcare: "bg-pink-100 text-pink-800",
        Utilities: "bg-gray-100 text-gray-800",
        Education: "bg-indigo-100 text-indigo-800",
        "Personal Care": "bg-teal-100 text-teal-800",
        Miscellaneous: "bg-orange-100 text-orange-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
};
