import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Render the current reporting month per request, rather than freezing it at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://expense-ai-redesigned.vercel.app"),
  title: "ExpenseAI | Smarter Naira Spending",
  description: "A private, Naira-first expense tracker that turns everyday transactions into useful financial insights.",
  openGraph: {
    title: "ExpenseAI | Smarter Naira Spending",
    description: "See where your money goes, stay inside your limits, and understand the pattern before month-end.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ExpenseAI | Smarter Naira Spending",
    description: "A clearer way to understand everyday spending in Naira.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
