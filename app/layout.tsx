import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "katex/dist/katex.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "SelectEd",
  description: "AI-powered exam prep for AMC, Maths Olympiad, ACER, ICAS, ATAR, and NAPLAN. Chat with a Socratic tutor, practice problems, and take timed mock exams.",
  metadataBase: new URL("https://selected-ed.vercel.app"),
  openGraph: {
    title: "SelectEd — Sharpen. Sit. Succeed.",
    description: "AI-powered exam prep for AMC, Maths Olympiad, ACER, ICAS, ATAR, and NAPLAN. Chat with a Socratic tutor, practice problems, and take timed mock exams.",
    url: "https://selected-ed.vercel.app",
    siteName: "SelectEd",
    type: "website",
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "SelectEd — Sharpen. Sit. Succeed.",
    description: "AI-powered exam prep for AMC, Maths Olympiad, ACER, ICAS, ATAR, and NAPLAN. Chat with a Socratic tutor, practice problems, and take timed mock exams.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
