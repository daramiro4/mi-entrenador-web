import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Títulos y palabra del anillo.
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["700", "800"], display: "swap" });
// Cuerpo.
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
// SIEMPRE para vatios, ppm, kg, %, TSS y fechas cortas.
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "Mi Entrenador",
  description: "Entrenador personal de ciclismo y fuerza",
};

export const viewport: Viewport = { themeColor: "#12151a", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${barlow.variable} ${plexSans.variable} ${plexMono.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <div className="app-root flex flex-col">
          <div className="relative flex-1 flex flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
