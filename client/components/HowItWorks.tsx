import React from "react";
import { motion } from "framer-motion";
import { Badge, BarChart3, Brain, MessageCircle } from "lucide-react";

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

const HowItWorks = () => {
    return (
        <motion.section
            id="how-it-works"
            className="px-6 py-24 bg-gradient-to-br from-gray-50 to-white"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerChildren}
        >
            <div className="max-w-6xl mx-auto">
                <motion.div variants={fadeInUp} className="text-center mb-20">
                    <Badge className="mb-4 px-3 py-1 bg-gray-100 text-gray-700 border-gray-200/50">
                        How it works
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Simple, Yet Powerful
                    </h2>
                    <p className="text-xl text-gray-600 font-light">
                        Get started in 3 effortless steps
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-12">
                    {[
                        {
                            step: "01",
                            title: "Message on WhatsApp",
                            description:
                                'Send "Coffee 50rs" or upload a bill photo',
                            detail: "Our AI instantly understands your expense and extracts all relevant details with 95% accuracy.",
                            icon: <MessageCircle className="w-6 h-6" />,
                            color: "blue",
                        },
                        {
                            step: "02",
                            title: "AI Processes Everything",
                            description:
                                "Smart categorization and data extraction",
                            detail: "Machine learning algorithms categorize expenses and structure your spending data automatically.",
                            icon: <Brain className="w-6 h-6" />,
                            color: "purple",
                        },
                        {
                            step: "03",
                            title: "Access Rich Insights",
                            description:
                                "Get magic link for detailed analytics",
                            detail: "Beautiful charts, budgets, and spending insights accessible through secure web dashboard.",
                            icon: <BarChart3 className="w-6 h-6" />,
                            color: "green",
                        },
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            variants={fadeInUp}
                            className="relative group"
                        >
                            {/* Connecting Line */}
                            {idx < 2 && (
                                <div className="hidden md:block absolute top-16 left-full w-12 h-0.5 bg-gradient-to-r from-gray-300 to-transparent z-0" />
                            )}

                            <div className="relative z-10">
                                {/* Step Number */}
                                <div
                                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${
                                        item.color === "blue"
                                            ? "from-blue-500 to-blue-600"
                                            : item.color === "purple"
                                            ? "from-purple-500 to-purple-600"
                                            : "from-green-500 to-green-600"
                                    } text-white font-bold text-lg mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                                >
                                    {item.icon}
                                </div>

                                <div className="space-y-4">
                                    <span className="text-sm font-medium text-gray-500 tracking-wider">
                                        STEP {item.step}
                                    </span>
                                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-lg text-gray-600 mb-3">
                                        {item.description}
                                    </p>
                                    <p className="text-gray-500 leading-relaxed">
                                        {item.detail}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
};

export default HowItWorks;
