import type { Metadata, Viewport } from "next";
import { ConvexClientProvider } from "@/components/convex-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inka Fish - Sistema de Gestión",
  description:
    "Sistema integral de gestión de solicitudes, abastecimiento, inventario y producción de Inka Fish",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Inka Fish",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#347B85",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
