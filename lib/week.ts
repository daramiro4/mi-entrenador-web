function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function addDays(date: string, days: number): string {
  const result = parseDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function daysBetween(fromDate: string, toDate: string): number {
  return Math.round((parseDate(toDate).getTime() - parseDate(fromDate).getTime()) / 86_400_000);
}

/** Lunes de la semana que contiene `dateISO`. */
export function getMondayOfWeek(dateISO: string): string {
  const dow = parseDate(dateISO).getUTCDay(); // 0=domingo..6=sábado
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  return addDays(dateISO, diffToMonday);
}

/** Domingo de la semana que empieza en `weekStartDate` (lunes). */
export function getWeekEndDate(weekStartDate: string): string {
  return addDays(weekStartDate, 6);
}

/** Índice de `dateISO` dentro de su semana, lunes=0..domingo=6. */
export function getWeekdayIndex(dateISO: string): number {
  const dow = parseDate(dateISO).getUTCDay(); // 0=domingo..6=sábado
  return dow === 0 ? 6 : dow - 1;
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}
