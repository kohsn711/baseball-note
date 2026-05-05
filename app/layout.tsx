import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "野球ノート",
  description: "中高生野球選手のための日々の記録アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
