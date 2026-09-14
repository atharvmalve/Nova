import type { Metadata } from "next";
import "./globals.css";
import { storeConfig } from "@/src/config/store";

export const metadata: Metadata = {
  title: { default: storeConfig.name, template: `%s | ${storeConfig.name}` },
  description: storeConfig.description,
  icons: { icon: storeConfig.branding.favicon },
  openGraph: { title: storeConfig.name, description: storeConfig.description, siteName: storeConfig.name },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col" style={{ "--primary": storeConfig.branding.primaryColor, "--accent": storeConfig.branding.accentColor } as React.CSSProperties}>{children}</body>
    </html>
  );
}
