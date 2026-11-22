import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Interactive Comment System",
  description: "Real-time audience interaction screen with dynamic QR code and Superadmin moderation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased select-none">
        {children}
      </body>
    </html>
  );
}
