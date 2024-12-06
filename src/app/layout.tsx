import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const interSans = localFont({
  src: "./fonts/InterVF.ttf",
  variable: "--font-inter-sans",
  weight: "100 900",
});
export const metadata: Metadata = {
  title: "Noterra",
  description: "The writing app for humans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${interSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
