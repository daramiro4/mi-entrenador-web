"use client";

import { useEffect, useState } from "react";
import { hasAnimation, loadRigFor } from "@/lib/exercises/animation-map";
import type { Rig } from "@/lib/exercises/rig/types";

// Caché de módulo: un rig se construye una vez (import dinámico del arquetipo: su código se descarga bajo demanda).
const cache = new Map<string, Promise<Rig | null>>();

export function loadRigCached(category: string, name: string): Promise<Rig | null> {
  const key = `${category}/${name}`;
  let p = cache.get(key);
  if (!p) {
    p = loadRigFor(category, name).catch(() => null);
    cache.set(key, p);
  }
  return p;
}

/** Rig de un ejercicio cargado bajo demanda. `null` mientras carga o si el ejercicio no tiene animación. */
export function useRig(category: string, name: string): { rig: Rig | null; loading: boolean } {
  const key = `${category}/${name}`;
  const animated = hasAnimation(category, name);
  const [loaded, setLoaded] = useState<{ key: string; rig: Rig | null } | null>(null);

  useEffect(() => {
    if (!animated) return;
    let live = true;
    loadRigCached(category, name).then((rig) => {
      if (live) setLoaded({ key, rig });
    });
    return () => {
      live = false;
    };
  }, [animated, category, name, key]);

  const current = loaded?.key === key ? loaded.rig : null;
  return { rig: current, loading: animated && loaded?.key !== key };
}
