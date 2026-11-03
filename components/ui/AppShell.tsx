import type { ReactNode } from "react";
import { SegmentedNav } from "./SegmentedNav";
import { TabBar } from "./TabBar";
import type { NavKey } from "./nav-items";

/** Barra superior sticky de vidrio + contenedor 1200px + tab bar móvil. */
export function AppShell({ active, children }: { active: NavKey | null; children: ReactNode }) {
  return (
    <>
      <header className="glass-bar sticky top-0 z-20 border-b-[0.5px] border-separator">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <span className="text-base font-semibold">Mi Entrenador</span>
          <SegmentedNav active={active} />
        </div>
      </header>
      <main className="pb-safe sm:pb-16 mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      <TabBar active={active} />
    </>
  );
}
