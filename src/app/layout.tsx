import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FeedbackButton } from "@/components/FeedbackButton";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://when-we-meet-gamma.vercel.app';

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "When We Meet | 초간편 친구 약속 날짜 조율",
    template: "%s | When We Meet",
  },
  description: "회원가입 없이 링크 하나로 친구들과 가장 완벽한 약속 날짜를 찾아보세요! 무료 모임 날짜 투표, 최적 일정 자동 계산, 캘린더 등록.",
  keywords: [
    "약속 날짜 조율",
    "모임 날짜 투표",
    "when2meet 한국어",
    "약속 잡기",
    "일정 조율 사이트",
    "친구 모임 투표",
    "시간 조율",
    "모임 캘린더",
    "when we meet"
  ],
  authors: [{ name: "When We Meet" }],
  creator: "When We Meet",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "우리언제만나",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    title: "When We Meet | 초간편 친구 약속 날짜 조율",
    description: "회원가입 없이 링크 하나로 친구들과 가장 완벽한 약속 날짜를 찾아보세요!",
    siteName: "When We Meet",
  },
  twitter: {
    card: "summary_large_image",
    title: "When We Meet | 초간편 친구 약속 날짜 조율",
    description: "회원가입 없이 링크 하나로 친구들과 가장 완벽한 약속 날짜를 찾아보세요!",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adSenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html
      lang="ko"
      className={`${plusJakarta.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* 구글 애드센스 스크립트 (환경변수 설정 시 자동 활성화) */}
        {adSenseClientId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        {/* 카카오 애드핏 스크립트 */}
        <Script
          type="text/javascript"
          src="//t1.daumcdn.net/kas/static/ba.min.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        {/* 💡 개발자에게 의견 보내기 플로팅 버튼 */}
        <FeedbackButton />
        {/* Vercel Web Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
