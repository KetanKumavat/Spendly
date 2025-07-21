import React from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Badge,
    BarChart3,
    Brain,
    Camera,
    MessageCircle,
    Shield,
    Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

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

export const Features = () => {
    return (
        <motion.section
            id="features"
            className="px-6 py-24 bg-gradient-to-b from-white to-gray-50/50"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerChildren}
        >
            <div className="max-w-7xl mx-auto">
                <motion.div variants={fadeInUp} className="text-center mb-20">
                    <Badge className="mb-4 px-3 py-1 bg-blue-50 text-blue-700 border-blue-200/50">
                        Features
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Why Choose Spendly?
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
                        Experience the future of expense tracking with
                        AI-powered insights and seamless integration.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Brain className="h-7 w-7 text-purple-600" />,
                            title: "AI Intelligence",
                            description:
                                "Advanced AI understands context, extracts data, and learns your spending patterns.",
                            gradient: "from-purple-50 to-pink-50",
                            border: "border-purple-200/50",
                        },
                        {
                            icon: <Zap className="h-7 w-7 text-yellow-600" />,
                            title: "Instant Processing",
                            description:
                                "Send a message, get instant expense tracking. Zero forms, zero hassle.",
                            gradient: "from-yellow-50 to-orange-50",
                            border: "border-yellow-200/50",
                        },
                        {
                            icon: <Camera className="h-7 w-7 text-blue-600" />,
                            title: "Smart OCR",
                            description:
                                "Snap a photo of any bill. Our AI extracts every detail automatically.",
                            gradient: "from-blue-50 to-cyan-50",
                            border: "border-blue-200/50",
                        },
                        {
                            icon: (
                                <BarChart3 className="h-7 w-7 text-green-600" />
                            ),
                            title: "Rich Analytics",
                            description:
                                "Beautiful dashboards with deep insights on spending patterns and trends.",
                            gradient: "from-green-50 to-emerald-50",
                            border: "border-green-200/50",
                        },
                        {
                            icon: (
                                <Shield className="h-7 w-7 text-indigo-600" />
                            ),
                            title: "Bank-Grade Security",
                            description:
                                "End-to-end encryption, secure magic links, and privacy-first design.",
                            gradient: "from-indigo-50 to-purple-50",
                            border: "border-indigo-200/50",
                        },
                        {
                            icon: (
                                <MessageCircle className="h-7 w-7 text-green-600" />
                            ),
                            title: "WhatsApp Native",
                            description:
                                "No new apps. Works directly in your favorite messaging platform.",
                            gradient: "from-green-50 to-teal-50",
                            border: "border-green-200/50",
                        },
                    ].map((feature, idx) => (
                        <motion.div
                            key={idx}
                            variants={fadeInUp}
                            whileHover={{
                                y: -8,
                                transition: { duration: 0.2 },
                            }}
                            className="group cursor-pointer"
                        >
                            <Card
                                className={`h-full bg-gradient-to-br ${feature.gradient} border ${feature.border} hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                            {feature.icon}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                                        {feature.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
};
