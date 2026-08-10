import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Runwal Gardens Tower 24 | ResidentHub Society Portal",
  description: "Official community portal for Tower 24, Runwal Gardens Dombivli. Event RSVPs, transparent maintenance ledger, verified local vendors, and AI meeting records.",
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
