import AuthBoundary from './components/AuthBoundary';
import ThemeToggle from './components/ThemeToggle';
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
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(() => { let theme; try { theme = localStorage.getItem('makerspace-theme'); } catch {} document.documentElement.dataset.theme = theme === 'light' || theme === 'dark' ? theme : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; })();` }} />
      </head>
      <body>
        <AuthBoundary>{children}</AuthBoundary>
        <ThemeToggle />
      </body>
    </html>
  );
}
