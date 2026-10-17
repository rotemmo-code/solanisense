// The design system's shared classes (tokens in theme.css), so every primary button, secondary button and card looks the same
const BUTTON = 'flex min-h-14 w-full items-center justify-center gap-3 rounded-card px-6 text-2xl font-bold';
export const PRIMARY_BUTTON = `${BUTTON} bg-primary text-on-primary`;
export const SECONDARY_BUTTON = `${BUTTON} border-2 border-secondary`;
export const CARD = 'rounded-card bg-surface p-4';
