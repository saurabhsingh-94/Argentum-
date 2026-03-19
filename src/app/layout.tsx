import type { Metadata } from "next";
import { Geist, Geist_Mono } from 'next/font/google';
import "./globals.css";
import ClientLayout from "./ClientLayout";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Argentum | Build in public. Prove it forever.",
  description: "The ultimate platform for builders to verify their progress on-chain.",
  openGraph: {
    title: "Argentum | Build in public. Prove it forever.",
    description: "The ultimate platform for builders to verify their progress on-chain.",
    url: "https://argentum-silk.vercel.app",
    siteName: "Argentum",
    images: [
      {
        url: "/og-image.png", // Assuming this will be added or generated
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Argentum",
    description: "Build in public. Prove it forever.",
    creator: "@argentum",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-background text-foreground">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
