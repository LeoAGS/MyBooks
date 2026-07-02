import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the personal catalog shell', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /catalogo pessoal/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /obras/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /lidas/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /na biblioteca/i })).toBeInTheDocument();
});
