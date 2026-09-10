"use client";

import { useCallback, useMemo, useState } from "react";
import { NumberToWords } from "persian-tools";

const NON_DIGIT_CHARS = /[^\u06F0-\u06F90-9]/g;
const PERSIAN_DIGITS = /[\u06F0-\u06F9]/g;
const ENGLISH_DIGITS = /[0-9]/g;
const COMMA_GROUPS = /(\d)(?=(\d{3})+(?!\d))/g;

function toEnglishDigits(str: string): string {
  return str.replace(PERSIAN_DIGITS, (d) =>
    String(d.charCodeAt(0) - 0x06f0),
  );
}

function toPersianDigits(str: string): string {
  return str.replace(ENGLISH_DIGITS, (d) =>
    String.fromCharCode(d.charCodeAt(0) + 0x06f0),
  );
}

function sanitizeInput(input: string): string {
  return input.replace(NON_DIGIT_CHARS, "");
}

/**
 * Keeps only Persian/English digits, converts Persian digits to English,
 * and removes separators. The result is always a plain digit string.
 */
function parseToRawNumber(input: string): string {
  return toEnglishDigits(sanitizeInput(input));
}

function formatWithCommas(input: string): string {
  if (!input) return "";
  return input.replace(COMMA_GROUPS, "$1,");
}

function formatToPersianWords(input: string): string {
  const num = Number(input);
  if (!input || !Number.isFinite(num) || num <= 0) return "";
  try {
    return `${toPersianDigits(NumberToWords(num))} تومان`;
  } catch {
    return "";
  }
}

export interface UsePriceInputReturn {
  rawValue: string;
  displayValue: string;
  persianWords: string;
  handleChange: (value: string) => void;
  handleBlur: (value: string) => void;
  setRawValue: (value: string) => void;
  reset: () => void;
}

export function usePriceInput(initialValue = ""): UsePriceInputReturn {
  const [rawValue, setRawValueState] = useState(() =>
    parseToRawNumber(initialValue),
  );
  const [displayValue, setDisplayValue] = useState(() => {
    const parsed = parseToRawNumber(initialValue);
    return parsed ? formatWithCommas(parsed) : "";
  });

  const applyValue = useCallback((value: string) => {
    const parsed = parseToRawNumber(value);
    setRawValueState(parsed);
    setDisplayValue(parsed ? formatWithCommas(parsed) : "");
  }, []);

  const handleChange = useCallback(
    (value: string) => applyValue(value),
    [applyValue],
  );

  const handleBlur = useCallback(
    (value: string) => applyValue(value),
    [applyValue],
  );

  const setRawValue = useCallback(
    (value: string) => applyValue(value),
    [applyValue],
  );

  const reset = useCallback(() => {
    setRawValueState("");
    setDisplayValue("");
  }, []);

  const persianWords = useMemo(
    () => (rawValue ? formatToPersianWords(rawValue) : ""),
    [rawValue],
  );

  return {
    rawValue,
    displayValue,
    persianWords,
    handleChange,
    handleBlur,
    setRawValue,
    reset,
  };
}