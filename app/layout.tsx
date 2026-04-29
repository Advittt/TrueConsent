import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrueConsent — Decode your medical paperwork",
  description:
    "Upload an EOB or medical consent form. We decode every code, flag wrongful denials, and write your appeal letter.",
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
          <Link href="/" className="brand">
            <div className="brand-mark" aria-hidden="true">
              T
            </div>
            <div>
              <div className="brand-name">TrueConsent</div>
              <span className="brand-tag">Decode your medical paperwork</span>
            </div>
          </Link>
          <nav className="topnav">
            <Link href="/">Bills &amp; Appeals</Link>
            <Link href="/consent">Consent Forms</Link>
          </nav>
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
