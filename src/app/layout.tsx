import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { ThemeEffect } from "@/components/ThemeEffect";
import "./globals.css";

const font = Manrope({ subsets: ["latin"], weight: ["400", "600", "800"], variable: "--font-manrope" });
export const metadata: Metadata = { title: "PulseBoard", description: "Project management for teams" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body>
        <StoreProvider>
          <ThemeEffect />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
