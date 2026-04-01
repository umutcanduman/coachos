import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoachOS",
  description: "The Operating System for Coaches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
