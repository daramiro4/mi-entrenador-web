const SEASON_BY_MONTH = [
  "Invierno", "Invierno", "Primavera", "Primavera", "Primavera", "Verano",
  "Verano", "Verano", "Otoño", "Otoño", "Otoño", "Invierno",
];

function formatDateEs(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function suggestSeasonName(
  goalType: string | null,
  eventType: string,
  eventDate: string
): string {
  if (goalType === "event_prep" && eventType.trim()) {
    return eventDate
      ? `Prep. ${eventType.trim()} - ${formatDateEs(eventDate)}`
      : `Prep. ${eventType.trim()}`;
  }

  const now = new Date();
  return `Temporada ${SEASON_BY_MONTH[now.getMonth()]} ${now.getFullYear()}`;
}
