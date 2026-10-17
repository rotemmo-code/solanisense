// UI icons drawn here, no icon library: one stroked path each on a 24 grid, in the color of the text beside them
const PATHS = {
  camera: 'M4 7h3l1.5-2.5h7L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM8.5 13a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0',
  info: 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 1 0 0-19M12 11v6M12 7.5h.01',
  upload: 'M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  knife: 'M14.5 2v11h-5c0-5.5 1.5-9 5-11ZM10.5 13v6.75a1.75 1.75 0 0 0 3.5 0V13',
  speaker: 'M3.5 9.5h3l5-4v13l-5-4h-3ZM15 9a4 4 0 0 1 0 6M18 5.5a7.5 7.5 0 0 1 0 13',
  book: 'M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5ZM12 6.5v13',
  // an exclamation, not a check: a checked shield would read as "safe", which the app never says
  shield: 'M12 2.5 4.5 5.5v6c0 4.5 3.2 8.2 7.5 10 4.3-1.8 7.5-5.5 7.5-10v-6ZM12 8v5M12 16.5h.01',
};

/** An icon beside a label, so hidden from screen readers. No data-shape: that attribute marks the verdict shapes only. */
export function Icon({ name, className = 'size-7' }: { name: keyof typeof PATHS; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}
