import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Blobs } from "@/components/ui/Blobs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mi Entrenador",
  description: "Entrenador personal de ciclismo y fuerza",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <div className="app-root flex flex-col">
          <Blobs />
          <div className="relative z-10 flex-1 flex flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
