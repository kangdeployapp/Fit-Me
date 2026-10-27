import type { Metadata, Viewport } from "next";
import "./globals.css";
import { IOSInstallPrompt } from "@/components/iOSInstallPrompt";
import { AutoNotificationWatcher } from "@/components/AutoNotificationWatcher";

export const metadata: Metadata = {
  title: "FitLife Tracker - ติดตามน้ำหนัก & สุขภาพ",
  description: "เว็บแอปพลิเคชัน Progressive Web App เพื่อสุขภาพ ลดน้ำหนัก บันทึกน้ำ ดื่มน้ำ และผูกก้าวเดิน Garmin",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitLife",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#007AFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full bg-[#F2F2F7]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FitLife" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-full font-sans antialiased text-gray-900 pb-safe selection:bg-blue-100">
        {children}
        <IOSInstallPrompt />
        <AutoNotificationWatcher />
      </body>
    </html>
  );
}
