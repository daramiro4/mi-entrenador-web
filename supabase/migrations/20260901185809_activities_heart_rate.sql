-- Garmin ya manda averageHR/maxHR/hrTimeInZone_1..5 en el resumen de cada
-- actividad (confirmado en raw_data ya sincronizado) pero solo se guardaba
-- potencia/TSS. Se amplía la tabla para no depender de re-parsear raw_data.
alter table public.activities
  add column avg_hr integer,
  add column max_hr integer,
  add column hr_zone_seconds jsonb;
