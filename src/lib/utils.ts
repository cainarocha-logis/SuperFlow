export const formatCurrency = (val: number | string | null): string => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (num === null || isNaN(num)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(num);
};

export const parseBrazilianNumber = (val: string): number | null => {
  if (!val) return null;
  // Replace comma with dot and remove other non-numeric chars except dot/comma
  const cleanVal = val.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleanVal);
  return isNaN(num) ? null : num;
};
