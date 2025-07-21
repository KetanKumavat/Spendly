import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";

const Navbar = () => {
    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-50 px-6 py-4 backdrop-blur-lg bg-white/80 border-b border-gray-200/50"
        >
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Spendly
                    </span>
                </div>
                <div className="hidden md:flex items-center space-x-8">
                    <a
                        href="#features"
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Features
                    </a>
                    <a
                        href="#how-it-works"
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        How it works
                    </a>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300"
                    >
                        Sign in
                    </Button>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
