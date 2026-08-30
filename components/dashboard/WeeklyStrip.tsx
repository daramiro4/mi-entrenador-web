const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

export function WeeklyStrip() {
  return (
    <div className="data-surface rounded-sm p-5">
      <p className="text-xs text-fog uppercase tracking-wide mb-3">Esta semana</p>
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day) => (
          <div key={day} className="flex flex-col items-center gap-1.5">
            <span className="text-xs text-fog">{day}</span>
            <div className="h-10 w-10 rounded-full border border-fog/25" />
          </div>
        ))}
      </div>
      <p className="text-sm text-fog mt-3">Aún no hay sesiones planificadas.</p>
    </div>
  );
}
