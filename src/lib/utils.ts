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

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]).join(';');
  const rows = data.map(obj => 
    Object.values(obj)
      .map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val)
      .join(';')
  ).join('\n');

  const csvContent = '\uFEFF' + headers + '\n' + rows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
