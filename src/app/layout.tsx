import type { Metadata, } from "next";
import { ThemeProvider, } from "@/components/theme-provider";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: "Chronos Codex",
  description: "Interactive, text-based, AI-powered D&D-style game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>,) {
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
