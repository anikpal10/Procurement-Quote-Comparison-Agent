import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { AppLayoutShell } from "../components/AppLayoutShell";

export const metadata: Metadata = {
    title: "ProcureAI - Intelligent Procurement Quote Comparison",
    description: "Enterprise procurement quote comparison and supplier management platform powered by Gemini AI",
};

interface RootLayoutProps {
    children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
                <AppLayoutShell>{children}</AppLayoutShell>
            </body>
        </html>
    );
}
