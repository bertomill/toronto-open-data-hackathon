import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL('https://your-domain.vercel.app'),
  title: "DollarSense - Toronto Budget Explorer",
  description: "Explore Toronto's budget data from 2019-2024 with AI-powered insights. Ask questions about city spending, analyze trends, and discover budget patterns across departments and programs.",
  keywords: ["Toronto", "budget", "city spending", "government transparency", "data analysis", "AI", "public finance"],
  authors: [{ name: "DollarSense Team" }],
  openGraph: {
    title: "DollarSense - Toronto Budget Explorer",
    description: "Explore Toronto's budget data with AI-powered insights",
    url: "https://your-domain.vercel.app",
    siteName: "DollarSense",
    images: [
      {
        url: "/dollarsense_logo_white.png",
        width: 1200,
        height: 630,
        alt: "DollarSense Toronto Budget Explorer",
      },
    ],
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DollarSense - Toronto Budget Explorer",
    description: "Explore Toronto's budget data with AI-powered insights",
    images: ["/dollarsense_logo_white.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
