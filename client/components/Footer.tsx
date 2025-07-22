import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const Footer = () => {
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

    const whatsappUrl = `https://wa.me/14155238886?text=${encodeURIComponent(
        "join hold-seed"
    )}`;
    return (
        <div>
            {/* Enhanced CTA Section */}
            <motion.section
                className="px-6 py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden"
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerChildren}
            >
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
                    <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div variants={fadeInUp}>
                        <Badge className="mb-6 px-4 py-2 bg-white/10 text-white border-white/20 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 mr-2" />
                            Ready to get started?
                        </Badge>

                        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                            Transform Your
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Expense Tracking
                            </span>
                        </h2>

                        <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto font-light leading-relaxed">
                            Join thousands of users who are already tracking
                            smarter with AI-powered insights
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button
                                size="lg"
                                className="group px-8 py-4 bg-gradient-to-r from-white to-gray-100 text-gray-900 hover:from-gray-100 hover:to-white shadow-xl hover:shadow-2xl transition-all duration-300"
                                onClick={() =>
                                    window.open(whatsappUrl, "_blank")
                                }
                            >
                                <MessageCircle className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                                Start Free on WhatsApp
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Footer */}
            <footer className="px-6 py-12 bg-gray-900 text-gray-400 border-t border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">
                                Spendly
                            </span>
                        </div>
                        <div className="flex items-center space-x-6">
                            <a
                                href="#features"
                                className="hover:text-white transition-colors"
                            >
                                Features
                            </a>
                            <a
                                href="#how-it-works"
                                className="hover:text-white transition-colors"
                            >
                                How it works
                            </a>
                            <span className="text-sm">
                                © 2024 Spendly. All rights reserved.
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Footer;
