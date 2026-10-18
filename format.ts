export const MAX_DISPLAY = 1e15;
export const inr = (x: number): string =>
  x > MAX_DISPLAY ? '> ₹1,000 lakh crore (reduce inputs)' : '₹' + Math.round(x).toLocaleString('en-IN');
