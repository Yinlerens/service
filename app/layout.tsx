import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Construct Chat",
  description: "A minimal constructivist AI chat interface",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
