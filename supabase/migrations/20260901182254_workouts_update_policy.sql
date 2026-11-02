-- `workouts` ya tenía políticas separadas de insert/select/delete pero
-- ninguna de update, así que editar una plantilla afectaría 0 filas en
-- silencio. Se añade solo la que falta, sin tocar las otras 3.
create policy "Users can update own workouts"
  on public.workouts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
