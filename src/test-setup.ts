import '@testing-library/jest-dom/vitest';

// jsdom does not load index.html, so the root gets the same attributes here; App.test checks index.html itself
document.documentElement.lang = 'he';
document.documentElement.dir = 'rtl';
