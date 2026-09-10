declare module "persian-tools" {
  export function NumberToWords(num: number): string;
  export function addCommas(num: number): string;
  export function removeCommas(str: string): string;
  export function digitsFaToEn(str: string): string;
  export function digitsEnToFa(str: string): string;
}
