import { NAV_TEXT } from '../strings';

type Destination = 'scan' | 'info';

/** Bottom bar with the two destinations. The active one is inverted, not only recolored, and marked aria-current for screen readers. */
export function NavBar({ active, onSelect }: { active: Destination; onSelect: (d: Destination) => void }) {
  return (
    <nav className="flex shrink-0 gap-2 border-t-2 border-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {(['scan', 'info'] as const).map(d => (
        <button key={d} type="button" aria-current={d === active ? 'page' : undefined} onClick={() => onSelect(d)}
          className="min-h-14 flex-1 rounded-xl border-2 border-white text-2xl font-bold aria-[current=page]:bg-white aria-[current=page]:text-black">
          {NAV_TEXT[d]}
        </button>
      ))}
    </nav>
  );
}
