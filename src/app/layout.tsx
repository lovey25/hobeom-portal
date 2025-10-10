import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageTitleProvider } from "@/contexts/PageTitleContext";
import { PortalHeader } from "@/components/PortalHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "호범 포털 - 포괄적인 웹 포털 서비스",
  description: "여러 기능을 통합한 현대적인 웹 포털 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <PageTitleProvider>
            <PortalHeader />
            {children}
          </PageTitleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
