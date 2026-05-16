import { render, screen } from '@testing-library/react';
import App from './Aplicacion';

test('muestra el texto learn react', () => {
  render(<App />);
  const texto = screen.getByText(/learn react/i);
  expect(texto).toBeInTheDocument();
});
