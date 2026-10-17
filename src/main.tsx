import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './ui/App.tsx';

// the service worker precaches the app, so it opens and scans offline after the first visit
// shortcut: autoUpdate reloads the page as soon as a new version installs, which can cut a scan short; upgrade to registerType 'prompt' with an update banner if that bites
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
