import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageTitleProvider } from "@/contexts/PageTitleContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PortalHeader } from "@/components/PortalHeader";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
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
  manifest: "/manifest.json",
  themeColor: "#3B82F6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "호범 포털",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ServiceWorkerRegistration />
        <AuthProvider>
          <NotificationProvider>
            <PageTitleProvider>
              <PortalHeader />
              {children}
            </PageTitleProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
