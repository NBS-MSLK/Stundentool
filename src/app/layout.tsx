import AuthBoundary from './components/AuthBoundary';
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MakerSpace Stundentool",
  description: "Einfache Zeiterfassung für das MakerSpace Projekt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <AuthBoundary>{children}</AuthBoundary>
      </body>
    </html>
  );
}
