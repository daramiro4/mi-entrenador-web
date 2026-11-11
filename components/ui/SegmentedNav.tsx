import Link from "next/link";
import { NAV_ITEMS, type NavKey } from "./nav-items";

/** Control segmentado superior (escritorio). */
export function SegmentedNav({ active }: { active: NavKey | null }) {
  return (
    <nav aria-label="Secciones" className="hidden sm:flex rounded-full bg-fill p-1">
      {NAV_ITEMS.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          aria-current={it.key === active ? "page" : undefined}
          className={`min-h-11 inline-flex items-center rounded-full px-5 text-sm font-medium ${
            it.key === active ? "bg-surface-2 text-label" : "text-label-2 hover:text-label"
          }`}
         
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
