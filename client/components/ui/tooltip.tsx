import React, { useState } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    side?: "top" | "bottom" | "left" | "right";
    className?: string;
}

export function Tooltip({
    children,
    content,
    side = "top",
    className = "",
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    const sideClasses = {
        top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
        left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
        right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
    };

    const arrowClasses = {
        top: "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800",
        bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800",
        left: "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800",
        right: "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800",
    };

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
            >
                {children}
            </div>

            {isVisible && (
                <div
                    className={`absolute z-[100] ${sideClasses[side]} ${className}`}
                    role="tooltip"
                >
                    <div className="bg-gray-800 text-white text-sm rounded-lg px-4 py-3 max-w-xs shadow-lg">
                        {content}
                        <div
                            className={`absolute w-0 h-0 border-4 ${arrowClasses[side]}`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

interface WhatsAppTooltipProps {
    children: React.ReactNode;
}

export function WhatsAppTooltip({ children }: WhatsAppTooltipProps) {
    return (
        <Tooltip
            content={
                <div className="space-y-2">
                    <div className="flex items-center space-x-1">
                        <Info className="w-4 h-4 text-blue-300" />
                        <span className="font-medium text-blue-100">
                            First time?
                        </span>
                    </div>
                    <div className="text-gray-200 text-left">
                        <p className="mb-2">To join our WhatsApp bot:</p>
                        <ol className="text-xs space-y-1">
                            <li>1. Click the button below</li>
                            <li>
                                2. Send exactly:{" "}
                                <code className="bg-gray-700 px-1 rounded text-green-300">
                                    join hold-seed
                                </code>
                            </li>
                            <li>3. Wait for Twilio confirmation</li>
                            <li>4. Send any message to get started!</li>
                            <li>5. Start tracking: &quot;50rs coffee&quot;</li>
                        </ol>
                    </div>
                    <div className="text-xs text-gray-300 border-t border-gray-600 pt-2">
                        💡 After joining, your first message activates the bot
                    </div>
                </div>
            }
            side="bottom"
            className="w-80"
        >
            {children}
        </Tooltip>
    );
}
