import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Vibey Hub",
  description: "Vibey World Internal Operating Platform — Modernizing Lives. Unlocking Potential.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} font-sans antialiased bg-[#0A0A0A] text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
