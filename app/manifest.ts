import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Entrenador",
    short_name: "Entrenador",
    description: "Entrenador personal de ciclismo",
    start_url: "/",
    display: "standalone",
    background_color: "#12151a",
    theme_color: "#12151a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
