/** "WARM_UP" → "warm up"; "_3_WAY_CALF_RAISE" → "3 way calf raise". Es lo que ve el usuario en el reloj. */
export function keyToWords(key: string): string {
  return key.replace(/^_+/, "").replace(/_/g, " ").trim().toLowerCase();
}

/** Línea de la ficha: "En el reloj: warm up · thoracic rotation". Si la clave del ejercicio es la de la categoría, no se repite. */
export function watchKey(category: string, name: string): string {
  const cat = keyToWords(category);
  const ex = keyToWords(name);
  return cat === ex ? `En el reloj: ${cat}` : `En el reloj: ${cat} · ${ex}`;
}
