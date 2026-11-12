import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "3D PIXEL | Tomatodos y Jarros",
  description:
    "Compra online tomatodos térmicos, jarros y accesorios de hidratación en 3D PIXEL - Detalles, Diseños y Decoraciones. Agrega al carrito y finaliza tu pedido por WhatsApp. Envíos a todo el Ecuador.",
  keywords: ["3D PIXEL", "tomatodos", "jarros", "termos", "botellas", "Ecuador", "WhatsApp", "tienda online", "detalles", "diseños"],
  authors: [{ name: "3D PIXEL" }],
  icons: {
    icon: "/logo-3dpixel.png",
  },
  openGraph: {
    title: "3D PIXEL | Tomatodos y Jarros",
    description: "Compra tomatodos y jarros online y paga por WhatsApp",
    siteName: "3D PIXEL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
