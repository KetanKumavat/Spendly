import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const Navbar = () => {
    const [showLoginModal, setShowLoginModal] = useState(false);

    return (
        <>
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
                            onClick={() => setShowLoginModal(true)}
                        >
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Access Dashboard
                        </Button>
                    </div>
                </div>
            </motion.nav>

            {/* Login Instructions Modal */}
            <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            Access Your Dashboard
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-center space-y-4 p-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <MessageCircle className="w-8 h-8 text-green-600" />
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900">
                            Login via WhatsApp
                        </h3>

                        <p className="text-gray-600">
                            To access your expense dashboard, send a message to
                            our WhatsApp bot:
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="text-left">
                                <p className="text-sm font-medium text-gray-700">
                                    Send any of these commands:
                                </p>
                                <div className="mt-2 space-y-1">
                                    <code className="block bg-white px-3 py-2 rounded border text-blue-600 font-mono text-sm">
                                        login
                                    </code>
                                    <code className="block bg-white px-3 py-2 rounded border text-blue-600 font-mono text-sm">
                                        dashboard
                                    </code>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 text-left">
                            <p className="text-sm text-blue-800">
                                <strong>📱 First time user?</strong>
                                <br />
                                1. Send{" "}
                                <code className="bg-blue-200 px-1 rounded">
                                    join hold-seed
                                </code>{" "}
                                to join our WhatsApp bot
                                <br />
                                2. Then send{" "}
                                <code className="bg-blue-200 px-1 rounded">
                                    login
                                </code>{" "}
                                to get dashboard access
                                <br />
                                3. Start tracking:{" "}
                                <em>&quot;50rs coffee at CCD&quot;</em>
                            </p>
                        </div>

                        <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => {
                                window.open(
                                    "https://wa.me/14155238886?text=join%20hold-seed",
                                    "_blank"
                                );
                                setShowLoginModal(false);
                            }}
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Open WhatsApp
                        </Button>

                        <div className="flex flex-col space-y-2">
                            <p className="text-xs text-gray-500">
                                You&apos;ll receive a secure magic link via
                                WhatsApp that expires in 15 minutes
                            </p>
                            <Button
                                onClick={() => setShowLoginModal(false)}
                                className="w-full"
                            >
                                Got it!
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Navbar;
