import { LoginForm } from "@/components/layout/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <p className="font-display text-4xl uppercase tracking-wide text-paper">
            Mi Entrenador
          </p>
          <p className="text-fog text-sm">Acceso sin contraseña, por email.</p>
        </div>
        <LoginForm initialError={error} />
      </div>
    </main>
  );
}
