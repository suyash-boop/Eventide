import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Header } from "@/components/layout/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eventide - Event Management Platform",
  description: "Create, discover and manage events with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
