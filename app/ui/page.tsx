import { Activity } from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tile } from "@/components/ui/Tile";
import { Chip } from "@/components/ui/Chip";
import { Ring } from "@/components/ui/Ring";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sparkline } from "@/components/ui/Sparkline";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function UiPage() {
  return (
    <AppShell active="hoy">
      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard hoverable>
          <h1 className="text-2xl font-semibold">Componentes base</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip>Neutro</Chip><Chip tone="success">Hecho</Chip><Chip tone="warning">Degradado</Chip>
            <Chip tone="danger">Saltado</Chip><Chip tone="accent">Hoy</Chip>
          </div>
          <div className="mt-4 flex gap-3">
            <Button>Primario</Button><Button variant="secondary">Secundario</Button>
          </div>
          <div className="mt-6"><ProgressBar value={62} max={100} label="Progreso de prueba" /></div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-6">
            <Ring progress={0.7} label="Anillo de prueba al 70 %"><span className="text-2xl font-semibold">70%</span></Ring>
            <div className="grid flex-1 grid-cols-2 gap-3">
              <Tile label="Sueño" dotColor="var(--m-sleep)"><p className="metric text-xl font-semibold">82</p></Tile>
              <Tile label="VFC" dotColor="var(--m-hrv)"><p className="metric text-xl font-semibold">54 ms</p></Tile>
            </div>
          </div>
          <div className="mt-4"><Sparkline values={[210, 214, 220, 219, 226, 231]} label="FTP de prueba" /></div>
        </GlassCard>
        <GlassCard><EmptyState icon={Activity} text="Estado vacío de ejemplo." /></GlassCard>
      </div>
    </AppShell>
  );
}
