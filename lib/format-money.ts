/**
 * Format a cent-integer to a US dollar string.
 * $1,847.00 → "$1,847"   $1,847.50 → "$1,847.50"
 */
export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  const hasCents = dollars % 1 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(dollars);
}
