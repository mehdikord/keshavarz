import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface ProvinceRow {
  id: bigint;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CityRow {
  id: bigint;
  provinceId: bigint;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

function isQuote(character: string): boolean {
  return character === "'" || character === '"';
}

/**
 * Splits a VALUES tuple (without the surrounding parens) into fields.
 * Handles single/double quoted strings and escaped quotes, ignoring
 * commas that appear inside quotes.
 */
function splitRowFields(inner: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quote: string | null = null;
  let escaped = false;

  for (const character of inner) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\") {
      current += character;
      escaped = true;
      continue;
    }
    if (quote) {
      current += character;
      if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (isQuote(character)) {
      quote = character;
      current += character;
      continue;
    }
    if (character === ",") {
      fields.push(current);
      current = "";
      continue;
    }
    current += character;
  }

  fields.push(current);
  return fields;
}

/**
 * Extracts an ordered list of row tuples from `INSERT INTO ... VALUES (...)`.
 * Assumes single-line tuples and no braces nested beyond one level.
 */
function extractInsertRows(sql: string): string[][] {
  const rows: string[][] = [];
  const insertMatches = sql.matchAll(
    /INSERT\s+INTO\s+`?[a-zA-Z0-9_]+`?\s*(?:\([^)]*(?:\([^)]*\)[^)]*)*\))?\s*VALUES/gi,
  );

  for (const match of insertMatches) {
    const rest = sql.slice(match.index! + match[0].length);
    const tuplePattern = /\(([^)]*(?:\([^)]*\)[^)]*)*)\)/g;
    let tupleMatch: RegExpExecArray | null;
    while ((tupleMatch = tuplePattern.exec(rest)) !== null) {
      const start = tupleMatch.index;
      if (start >= 0 && rest[start - 1] === ",") {
        continue;
      }
      rows.push(splitRowFields(tupleMatch[1]!));
      if (rest[tupleMatch.index + tupleMatch[0].length] !== ",") {
        break;
      }
    }
  }

  return rows;
}

function unquote(raw: string | undefined): string {
  if (raw === undefined) return "";
  return raw.trim().replace(/^['"]|['"]$/g, "").trim();
}

function parseTimestamp(raw: string | undefined): Date | null {
  if (raw === undefined) return null;
  const trimmed = unquote(raw);
  if (!trimmed || trimmed.toLowerCase() === "null") {
    return null;
  }
  const value = new Date(trimmed);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseNullableBigInt(raw: string | undefined): bigint | null {
  if (raw === undefined) return null;
  const trimmed = unquote(raw);
  if (trimmed.toLowerCase() === "null") {
    return null;
  }
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

function cleanName(raw: string | undefined): string {
  if (raw === undefined) return "";
  // Navicat dumps often append a literal "\n" (backslash + n) escape sequence
  // to VARCHAR values. Strip trailing \n / \r escape sequences and any
  // residual real newline/carriage-return characters.
  return unquote(raw).replace(/(?:\\[nr])+$/g, "").replace(/[\r\n]+$/g, "");
}

export async function loadProvincesFromSql(filePath: string): Promise<ProvinceRow[]> {
  const sql = await readFile(filePath, "utf8");
  const rows = extractInsertRows(sql);

  return rows.flatMap((fields) => {
    // (id, name, deleted_at, created_at, updated_at)
    const [idRaw, nameRaw, , createdAtRaw, updatedAtRaw] = fields;
    const id = parseNullableBigInt(idRaw);
    const createdAt = parseTimestamp(createdAtRaw);
    const updatedAt = parseTimestamp(updatedAtRaw);
    const name = cleanName(nameRaw);

    if (id === null || !name) {
      return [];
    }

    return [
      {
        id,
        name,
        createdAt: createdAt ?? new Date(),
        updatedAt: updatedAt ?? new Date(),
      },
    ];
  });
}

export async function loadCitiesFromSql(filePath: string): Promise<CityRow[]> {
  const sql = await readFile(filePath, "utf8");
  const rows = extractInsertRows(sql);

  return rows.flatMap((fields) => {
    // (id, province_id, name, deleted_at, created_at, updated_at)
    const [idRaw, provinceIdRaw, nameRaw, , createdAtRaw, updatedAtRaw] = fields;
    const id = parseNullableBigInt(idRaw);
    const provinceId = parseNullableBigInt(provinceIdRaw);
    const createdAt = parseTimestamp(createdAtRaw);
    const updatedAt = parseTimestamp(updatedAtRaw);
    const name = cleanName(nameRaw).replace(/[\n\r]+$/, "");

    if (id === null || provinceId === null || !name) {
      return [];
    }

    return [
      {
        id,
        provinceId,
        name,
        createdAt: createdAt ?? new Date(),
        updatedAt: updatedAt ?? new Date(),
      },
    ];
  });
}

export function resolveGeoDataPath(relative: string): string {
  return resolve(process.cwd(), relative);
}
