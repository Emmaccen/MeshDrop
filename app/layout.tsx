import { metaData } from "@/app/_data/constants";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: metaData.title,
  description: metaData.description,
  applicationName: metaData.title,
  referrer: "origin-when-cross-origin",
  generator: "Next.js",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "Technology",
  twitter: {
    card: "summary_large_image",
    title: metaData.title,
    description: metaData.description,
  },
  openGraph: {
    title: metaData.title,
    description: metaData.description,
    siteName: metaData.title,
    locale: "en_US",
    type: "website",
  },
  appleWebApp: {
    title: metaData.title,
    statusBarStyle: "black-translucent",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
