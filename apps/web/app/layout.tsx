import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR Platform",
  description: "HR management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col"
      >
        {children}
      </body>
    </html>
  );
}