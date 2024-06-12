import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpareTalk",
  description: "Spare time chatting with someone in the world",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="w-full h-full">
      <body
        className={`${inter.className} antialiased w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400`}
      >
        {children}
      </body>
    </html>
  );
}
