/**
 * Title search for agriculture news. Shared by the server (stored
 * `search_title`, query words) and the page (match highlighting), so both agree
 * on what a match is. Changing the rules requires re-saving `search_title`.
 *
 * Forgiven: Arabic vs Persian letters, hamza/madda (آب = اب), diacritics,
 * Persian/Arabic/Latin digits, letter case, punctuation and the half-space.
 */

// Dropped inside a word: half-space, joiner, direction marks, tatweel, BOM.
const INVISIBLE = /[​-‏‪-‮⁦-⁩ـ﻿]/;

const LETTERS: Record<string, string> = {
  "ء": "", // ء
  "ة": "ه", // ة → ه
  "ك": "ک", // ك → ک
  "ى": "ی", // ى → ی
  "ي": "ی", // ي → ی
  "ە": "ه", // ە → ه
};

/** One source character to what is searched: "" (dropped), " " (separator) or letters/digits. */
function foldChar(char: string): string {
  if (INVISIBLE.test(char)) return "";
  let folded = "";
  for (const part of char.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()) {
    const code = part.codePointAt(0)!;
    if (code >= 0x06f0 && code <= 0x06f9) folded += String(code - 0x06f0);
    else if (code >= 0x0660 && code <= 0x0669) folded += String(code - 0x0660);
    else if (part in LETTERS) folded += LETTERS[part];
    else folded += /[\p{L}\p{N}]/u.test(part) ? part : " ";
  }
  return folded;
}

export function normalizeSearchText(value: string): string {
  return Array.from(value, foldChar).join("").replace(/\s+/g, " ").trim();
}

/**
 * Words that must all occur in a title. A half-space in the query splits words,
 * so «گندم‌کاران» finds both «گندم کاران» and «گندم‌کاران».
 * The words hold only letters and digits, so they are safe inside LIKE.
 */
export function searchWords(query: string): string[] {
  const words = normalizeSearchText(query.replace(/‌/g, " ")).split(" ").filter(Boolean);
  return [...new Set(words)].slice(0, 8);
}

export interface TitlePart {
  match: boolean;
  text: string;
}

/**
 * Splits a title for highlighting. Whole words are marked, never fragments:
 * wrapping part of a Persian word in an element can break letter joining.
 */
export function highlightTitle(title: string, words: string[]): TitlePart[] {
  if (words.length === 0) return [{ match: false, text: title }];
  return title
    .split(/(\s+)/)
    .filter(Boolean)
    .map((text) => {
      const folded = normalizeSearchText(text);
      return { match: folded !== "" && words.some((word) => folded.includes(word)), text };
    });
}
