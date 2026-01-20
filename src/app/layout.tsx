import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  themeColor: "#a855f7",
};

export const metadata: Metadata = {
  title: "MindSync | AI-Powered Productivity Workspace",
  description:
    "Bridge the gap between planning and execution with intelligent meeting notes and smart calendar integration.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MindSync",
  },
  icons: {
    icon: "/icons/icon-512.png",
    apple: "/icons/icon-192.png",
  },
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
