import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calmly — a gentle space to unwind",
  description: "Chat about your day, understand your emotions, and track your mood over time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
