export const NAV_ITEMS = [
  { key: "hoy", label: "Hoy", href: "/dashboard" },
  { key: "plan", label: "Plan", href: "/dashboard#plan" },
  { key: "fuerza", label: "Fuerza", href: "/fuerza" },
  { key: "progreso", label: "Progreso", href: "/dashboard#progreso" },
] as const;
export type NavKey = (typeof NAV_ITEMS)[number]["key"];
