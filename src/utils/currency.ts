// Values are always handled in centavos (integer), matching the backend's `valor` column.

export const formatCentavosParaBRL = (centavos: number): string =>
  (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

// Takes whatever the user typed/pasted into the masked field, keeps only digits,
// and returns the resulting integer centavos — e.g. "10,00" / "R$ 10,00" / "1000" all parse consistently
// because the mask always treats the trailing two digits as cents.
export const paraCentavos = (valorDigitado: string): number => {
  const apenasDigitos = valorDigitado.replace(/\D/g, '');
  return apenasDigitos ? parseInt(apenasDigitos, 10) : 0;
};
