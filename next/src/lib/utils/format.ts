const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toLatinDigits(value: string): string {
  const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabic = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

  return value
    .split("")
    .map((char) => {
      const persianIndex = persian.indexOf(char);
      if (persianIndex >= 0) return String(persianIndex);
      const arabicIndex = arabic.indexOf(char);
      if (arabicIndex >= 0) return String(arabicIndex);
      return char;
    })
    .join("");
}

export function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

export function formatPrice(amount: number): string {
  const formatted = new Intl.NumberFormat("fa-IR").format(amount);
  return `${formatted} تومان`;
}

export function formatDistance(km: number): string {
  const rounded = Math.round(km * 10) / 10;
  return `${toPersianDigits(rounded)} کیلومتر`;
}
