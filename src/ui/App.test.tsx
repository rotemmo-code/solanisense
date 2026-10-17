// src/ui/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from './App';
test('מציג את שם האפליקציה', () => {
  render(<App />);
  expect(screen.getByText('SolaniSense')).toBeInTheDocument();
});
