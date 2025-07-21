import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// const inter = Inter({ subsets: ["latin"] });
const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
    variable: "--font-plus-jakarta",
    display: "swap",
});
export const metadata: Metadata = {
    title: "Spendly - Smart WhatsApp Expense Tracker",
    description:
        "Track your expenses using WhatsApp with AI-powered categorization and smart analytics",
    keywords: [
        "expense tracker",
        "whatsapp",
        "AI",
        "budget",
        "financial management",
    ],
    authors: [{ name: "Ketan" }],
    viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="scroll-smooth">
            <body
                className={`${plusJakarta.className} font-sans antialiased min-h-screen bg-gradient-to-br from-slate-50 to-blue-50`}
            >
                {children}
            </body>
        </html>
    );
}
