"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    MessageCircle,
    Camera,
    ArrowRight,
    Sparkles,
    ChevronDown,
    Send,
    Mic,
    RefreshCcw,
    LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppTooltip } from "@/components/ui/tooltip";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Features } from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.21, 1.11, 0.81, 0.99] },
};

const staggerChildren = {
    animate: {
        transition: {
            staggerChildren: 0.15,
        },
    },
};

export default function HomePage() {
    const [demoInput, setDemoInput] = useState("");
    const [demoMessages, setDemoMessages] = useState<
        Array<{ type: "user" | "bot"; text: string; time: string }>
    >([]);
    const [isTyping, setIsTyping] = useState(false);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 300], [0, -50]);

    const suggestedMessages = [
        "50rs coffee at Starbucks",
        "1200 groceries from BigBasket",
        "300rs Uber ride",
        "150 lunch at KFC",
        "75rs tea and snacks",
    ];

    const botResponses = useMemo(
        (): Record<string, string> => ({
            "50rs coffee at starbucks":
                "✅ Expense saved!\n💰 ₹50 - Food & Dining\n🏪 Vendor: Starbucks\n📅 Today\n\nYour food budget: ₹1,450/₹5,000 (29%)",
            "1200 groceries from bigbasket":
                "✅ Expense saved!\n💰 ₹1,200 - Groceries\n🏪 Vendor: BigBasket\n📅 Today\n\nYour grocery budget: ₹3,200/₹8,000 (40%)",
            "300rs uber ride":
                "✅ Expense saved!\n💰 ₹300 - Transportation\n🏪 Vendor: Uber\n📅 Today\n\nYour transport budget: ₹800/₹3,000 (27%)",
            "150 lunch at kfc":
                "✅ Expense saved!\n💰 ₹150 - Food & Dining\n🏪 Vendor: KFC\n📅 Today\n\nYour food budget: ₹1,600/₹5,000 (32%)",
            "75rs tea and snacks":
                "✅ Expense saved!\n💰 ₹75 - Food & Dining\n🏪 Vendor: Local Store\n📅 Today\n\nYour food budget: ₹1,675/₹5,000 (34%)",
        }),
        []
    );

    const whatsappUrl = `https://wa.me/14155238886?text=${encodeURIComponent(
        "join%20%hold-seed"
    )}`;

    const getCurrentTime = () => {
        const now = new Date();
        return now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const handleSendMessage = useCallback(async () => {
        if (!demoInput.trim()) return;

        const userMessage = {
            type: "user" as const,
            text: demoInput,
            time: getCurrentTime(),
        };

        setDemoMessages((prev) => [...prev, userMessage]);
        const inputToProcess = demoInput;
        setDemoInput("");
        setIsTyping(true);

        setTimeout(() => {
            const normalizedInput = inputToProcess.toLowerCase().trim();
            const response =
                botResponses[normalizedInput] ||
                "✅ Expense saved!\n💰 Amount processed\n📅 Today\n\nI'll learn to categorize this better next time! 🤖";

            const botMessage = {
                type: "bot" as const,
                text: response,
                time: getCurrentTime(),
            };

            setDemoMessages((prev) => [...prev, botMessage]);
            setIsTyping(false);
        }, 1500);
    }, [demoInput, botResponses]);

    const handleSuggestedMessage = (message: string) => {
        setDemoInput(message);
    };

    const resetDemo = () => {
        setDemoMessages([]);
        setDemoInput("");
        setIsTyping(false);
    };

    useEffect(() => {
        return () => {
            setIsTyping(false);
        };
    }, []);

    const handleDemoInteraction = () => {
        if (demoInput.trim()) {
            handleSendMessage();
        } else if (demoMessages.length > 0) {
            resetDemo();
        } else {
            const randomMessage =
                suggestedMessages[
                    Math.floor(Math.random() * suggestedMessages.length)
                ];
            setDemoInput(randomMessage);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-40 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-green-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
            </div>

            <Navbar />

            <motion.section
                className="relative px-6 py-16 text-center overflow-hidden"
                initial="initial"
                animate="animate"
                variants={staggerChildren}
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        variants={fadeInUp}
                        className="max-w-4xl mx-auto relative z-10 mb-16"
                    >
                        {/* Floating Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center mb-8"
                        >
                            <Badge className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200/50 shadow-sm">
                                <Sparkles className="w-3 h-3 mr-2" />
                                AI-Powered Expense Intelligence
                            </Badge>
                        </motion.div>

                        {/* Hero Title */}
                        <motion.h1
                            variants={fadeInUp}
                            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
                        >
                            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
                                Track Expenses
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                                via WhatsApp
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            variants={fadeInUp}
                            className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed font-light"
                        >
                            Simply send{" "}
                            <motion.span
                                className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-200/50"
                                whileHover={{ scale: 1.05 }}
                            >
                                &quot;Coffee 50rs&quot;
                            </motion.span>{" "}
                            or snap a photo. Our AI handles categorization,
                            insights, and budgets automatically.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
                        >
                            <WhatsAppTooltip>
                                <Button
                                    size="lg"
                                    className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                                    onClick={() =>
                                        window.open(whatsappUrl, "_blank")
                                    }
                                >
                                    <MessageCircle className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                                    Start Free on WhatsApp
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </WhatsAppTooltip>

                            <Link href="/demo">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="px-8 py-4 border-gray-300 hover:bg-gray-50"
                                >
                                    <LayoutDashboard className="mr-2 h-5 w-5" />
                                    Demo Dashboard
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Phone Demo */}
                    <motion.div
                        variants={fadeInUp}
                        style={{ y: y1 }}
                        className="relative w-full max-w-sm mx-auto mb-16"
                    >
                        <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-[2.5rem] shadow-2xl border border-gray-200/50 overflow-hidden backdrop-blur-sm p-2">
                            {/* Phone Frame */}
                            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700 rounded-[2rem] p-1">
                                <div className="w-full h-full bg-black rounded-[1.5rem] relative overflow-hidden flex flex-col min-h-[600px]">
                                    {/* Status Bar */}
                                    <div className="bg-gray-900 text-white px-6 py-3 flex justify-between items-center text-xs flex-shrink-0">
                                        <span>{getCurrentTime()}</span>
                                        <div className="flex space-x-1">
                                            <div className="w-4 h-2 bg-white rounded-sm"></div>
                                            <div className="w-1 h-2 bg-white rounded-sm"></div>
                                        </div>
                                    </div>

                                    {/* WhatsApp Header */}
                                    <div className="bg-green-600 text-white p-4 flex items-center flex-shrink-0">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-left font-semibold">
                                                Spendly
                                            </p>
                                            <p className="text-left text-xs text-green-100">
                                                Online
                                            </p>
                                        </div>
                                    </div>

                                    {/* Chat Messages */}
                                    <div className="flex-1 p-4 space-y-4 bg-gray-100 overflow-y-auto min-h-[300px]">
                                        {demoMessages.length === 0 &&
                                            !isTyping && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex flex-col justify-center items-center h-full"
                                                >
                                                    <div className="text-center text-gray-400 mb-6">
                                                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Sparkles className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                        <p className="text-sm font-medium mb-1">
                                                            Try our AI expense
                                                            tracker!
                                                        </p>
                                                        <p className="text-xs">
                                                            Type an expense or
                                                            pick a suggestion
                                                            below
                                                        </p>
                                                    </div>

                                                    {/* Suggested Messages */}
                                                    <div className="space-y-2 w-full max-w-[85%]">
                                                        {suggestedMessages
                                                            .slice(0, 3)
                                                            .map(
                                                                (
                                                                    suggestion,
                                                                    idx
                                                                ) => (
                                                                    <motion.button
                                                                        key={
                                                                            idx
                                                                        }
                                                                        initial={{
                                                                            opacity: 0,
                                                                            y: 10,
                                                                        }}
                                                                        animate={{
                                                                            opacity: 1,
                                                                            y: 0,
                                                                        }}
                                                                        transition={{
                                                                            delay:
                                                                                idx *
                                                                                0.1,
                                                                        }}
                                                                        onClick={() =>
                                                                            handleSuggestedMessage(
                                                                                suggestion
                                                                            )
                                                                        }
                                                                        className="w-full text-left bg-white/80 hover:bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 hover:text-gray-900 transition-all duration-200 hover:shadow-sm"
                                                                    >
                                                                        💸{" "}
                                                                        {
                                                                            suggestion
                                                                        }
                                                                    </motion.button>
                                                                )
                                                            )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        {demoMessages.map((msg, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{
                                                    opacity: 0,
                                                    y: 10,
                                                    x:
                                                        msg.type === "user"
                                                            ? 20
                                                            : -20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    x: 0,
                                                }}
                                                transition={{
                                                    delay: 0.1,
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 30,
                                                }}
                                                className={`flex ${
                                                    msg.type === "user"
                                                        ? "justify-end"
                                                        : "justify-start"
                                                }`}
                                            >
                                                <div
                                                    className={`max-w-[85%] px-4 py-3 ${
                                                        msg.type === "user"
                                                            ? "bg-green-500 text-white rounded-2xl rounded-br-md"
                                                            : "bg-white text-gray-900 shadow-sm border border-gray-100 rounded-2xl rounded-bl-md"
                                                    }`}
                                                >
                                                    <p
                                                        className={`text-sm whitespace-pre-line leading-relaxed ${
                                                            msg.type === "user"
                                                                ? "text-right"
                                                                : "text-left"
                                                        }`}
                                                    >
                                                        {msg.text}
                                                    </p>
                                                    <p
                                                        className={`text-xs mt-2 ${
                                                            msg.type === "user"
                                                                ? "text-green-100 text-right"
                                                                : "text-gray-400 text-left"
                                                        }`}
                                                    >
                                                        {msg.time}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}{" "}
                                        {isTyping && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    x: -20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    x: 0,
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 30,
                                                }}
                                                className="flex justify-start"
                                            >
                                                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        AI is thinking...
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Input Area */}
                                    <div className="p-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                                        <div className="flex items-center space-x-2 mb-3">
                                            {/* Attachment Icon */}
                                            <button
                                                className="flex-shrink-0 w-7 h-7 bg-gray-300 hover:bg-gray-400 rounded-full flex items-center justify-center transition-colors"
                                                onClick={() =>
                                                    handleSuggestedMessage(
                                                        "📷 Photo of restaurant bill"
                                                    )
                                                }
                                            >
                                                <Camera className="w-3.5 h-3.5 text-gray-600" />
                                            </button>

                                            {/* Input Container */}
                                            <div className="flex-1 min-w-0 relative bg-white rounded-2xl border border-gray-300 shadow-sm">
                                                <div className="flex items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Type your expense... e.g. '50rs coffee'"
                                                        value={demoInput}
                                                        onChange={(e) =>
                                                            setDemoInput(
                                                                e.target.value
                                                            )
                                                        }
                                                        onKeyPress={(e) =>
                                                            e.key === "Enter" &&
                                                            handleSendMessage()
                                                        }
                                                        className="flex-1 min-w-0 px-2.5 py-2 bg-transparent text-sm focus:outline-none placeholder-gray-400"
                                                        disabled={isTyping}
                                                    />
                                                    <div className="flex items-center space-x-1 pr-1.5">
                                                        <button
                                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                                            onClick={() => {
                                                                const emojis = [
                                                                    "😊",
                                                                    "💰",
                                                                    "🛒",
                                                                    "🍕",
                                                                    "☕",
                                                                ];
                                                                const randomEmoji =
                                                                    emojis[
                                                                        Math.floor(
                                                                            Math.random() *
                                                                                emojis.length
                                                                        )
                                                                    ];
                                                                setDemoInput(
                                                                    (prev) =>
                                                                        prev +
                                                                        randomEmoji
                                                                );
                                                            }}
                                                        >
                                                            <span className="text-sm">
                                                                😊
                                                            </span>
                                                        </button>
                                                        <button
                                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                                            onClick={() =>
                                                                handleSuggestedMessage(
                                                                    "🎤 Voice: Fifty rupees for coffee"
                                                                )
                                                            }
                                                        >
                                                            <Mic className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Send Button */}
                                            <Button
                                                onClick={handleDemoInteraction}
                                                size="sm"
                                                disabled={isTyping}
                                                className={`flex-shrink-0 w-9 h-9 p-0 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
                                                    demoInput.trim()
                                                        ? "bg-green-500 hover:bg-green-600"
                                                        : demoMessages.length >
                                                          0
                                                        ? "bg-blue-500 hover:bg-blue-600"
                                                        : "bg-gray-400 hover:bg-gray-500"
                                                }`}
                                            >
                                                {isTyping ? (
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : demoInput.trim() ? (
                                                    <Send className="w-3.5 h-3.5" />
                                                ) : demoMessages.length > 0 ? (
                                                    <span className="text-xs">
                                                        <RefreshCcw />
                                                    </span>
                                                ) : (
                                                    <span className="text-xs">
                                                        ✨
                                                    </span>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Demo Instructions */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center"
                                        >
                                            <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-white/90 px-3 py-1.5 rounded-full border border-gray-300 shadow-sm">
                                                {isTyping ? (
                                                    <>
                                                        <span className="animate-pulse">
                                                            🤖
                                                        </span>
                                                        <span className="font-medium">
                                                            AI is processing...
                                                        </span>
                                                    </>
                                                ) : demoInput.trim() ? (
                                                    <>
                                                        <span>🚀</span>
                                                        <span className="font-medium">
                                                            Press Enter or click
                                                            send!
                                                        </span>
                                                    </>
                                                ) : demoMessages.length > 0 ? (
                                                    <>
                                                        <span>🎉</span>
                                                        <span className="font-medium">
                                                            Try another expense
                                                            or reset!
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="animate-pulse">
                                                            ✨
                                                        </span>
                                                        <span className="font-medium">
                                                            Interactive demo -
                                                            try typing!
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="flex justify-center"
                >
                    <ChevronDown className="w-6 h-6 text-gray-400 animate-bounce" />
                </motion.div>
            </motion.section>
            <Features />
            <HowItWorks />
            <Footer />
        </div>
    );
}
