import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeshDrop",
  description:
    "A browser-based file transfer solution that enables seamless, direct device-to-device file sharing without the need for installation or cloud services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={``}>{children}</body>
    </html>
  );
}
