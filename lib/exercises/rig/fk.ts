import type { Vec } from "./types";

/** Cinemática directa 2D para construir poses con huesos de longitud constante (SVG: x→derecha, y→abajo). */
const RAD = Math.PI / 180;

/** Punto a `len` de `origin` en el ángulo `deg` medido desde +x en sentido horario (-90 = arriba, 90 = abajo, 0 = adelante). */
export const polar = (origin: Vec, deg: number, len: number): Vec => [origin[0] + len * Math.cos(deg * RAD), origin[1] + len * Math.sin(deg * RAD)];

/** Ángulo (grados) desde `a` hacia `b`. */
export const angleOf = (a: Vec, b: Vec): number => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD;

/**
 * Cinemática inversa de dos huesos: dados el origen A, el destino C y las longitudes l1 (A→B) y l2 (B→C), devuelve la
 * articulación B. `bend` elige la solución (1 / -1). Si C está fuera de alcance, se queda en el límite (hueso estirado).
 */
export function ik2(a: Vec, c: Vec, l1: number, l2: number, bend: 1 | -1): Vec {
  let d = Math.hypot(c[0] - a[0], c[1] - a[1]);
  const maxReach = (l1 + l2) * 0.9999;
  const minReach = Math.abs(l1 - l2) * 1.0001 + 1e-6;
  d = Math.min(maxReach, Math.max(minReach, d));
  const base = Math.atan2(c[1] - a[1], c[0] - a[0]);
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const ang = Math.acos(Math.max(-1, Math.min(1, cosA)));
  return [a[0] + l1 * Math.cos(base + bend * ang), a[1] + l1 * Math.sin(base + bend * ang)];
}

/** Medidas del esqueleto (unidades del lienzo 480×300; de pie mide ≈ 190). */
export const BODY = {
  head_r: 14,
  neck_to_head: 24,
  torso: 70,
  upper_arm: 36,
  forearm: 32,
  thigh: 56,
  shin: 54,
  foot: 22,
} as const;

export const round1 = (v: Vec): Vec => [Math.round(v[0] * 10) / 10, Math.round(v[1] * 10) / 10];
