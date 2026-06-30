import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the personal catalog shell', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /catalogo pessoal/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /leituras/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /biblioteca/i })).toBeInTheDocument();
});
