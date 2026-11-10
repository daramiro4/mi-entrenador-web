import type { NextConfig } from "next";

// Cabeceras de seguridad para todas las rutas. Sin CSP con nonce a propósito: Next inyecta scripts en línea
// y una CSP estricta exige nonces por petición; aquí van las defensas que no rompen nada.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" }, // anti-clickjacking
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }, // idem, estándar moderno
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
