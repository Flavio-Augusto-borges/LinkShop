export function calculateDiscountPercentage(price: number, originalPrice?: number) {
  if (!originalPrice || originalPrice <= price) {
    return 0;
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
