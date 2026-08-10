import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResidentHub | Society Management & AI Copilot",
  description: "All-in-one community management, event RSVP, transparent funds ledger, and deterministic meeting AI copilot.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
