import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrueConsent — Understand before you sign",
  description:
    "Upload a medical consent form and get a plain-English summary, key risks, and questions to ask your doctor before signing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              T
            </div>
            <div>
              <div className="brand-name">TrueConsent</div>
              <span className="brand-tag">Understand before you sign</span>
            </div>
          </div>
        </header>
        <div className="disclaimer" role="note">
          <span className="disclaimer-icon" aria-hidden="true">
            ⓘ
          </span>
          <span>
            TrueConsent does not provide medical, legal, or financial advice.
            Always confirm with your provider.
          </span>
        </div>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
