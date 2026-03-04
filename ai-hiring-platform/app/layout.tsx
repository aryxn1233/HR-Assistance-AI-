import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Use Inter via next/font
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

import { AuthGuard } from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "HireMe - AI Recruitment Platform",
  description: "Modern AI-powered technical recruitment and interview platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
            <Toaster richColors closeButton position="top-right" />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
