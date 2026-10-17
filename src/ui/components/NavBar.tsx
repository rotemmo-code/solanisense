import { NAV_TEXT } from '../strings';
import { Icon } from './Icon';

type Destination = 'scan' | 'info';

/** Bottom bar with the two destinations. The active one is a filled pill, not only recolored, and marked aria-current for screen readers. */
export function NavBar({ active, onSelect }: { active: Destination; onSelect: (d: Destination) => void }) {
  return (
    <nav className="flex shrink-0 gap-2 bg-surface p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {(['scan', 'info'] as const).map(d => (
        <button key={d} type="button" aria-current={d === active ? 'page' : undefined} onClick={() => onSelect(d)}
          className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-card text-2xl font-bold text-text-muted aria-[current=page]:bg-primary aria-[current=page]:text-on-primary">
          <Icon name={d === 'scan' ? 'camera' : 'info'} />
          {NAV_TEXT[d]}
        </button>
      ))}
    </nav>
  );
}
