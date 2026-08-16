"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { toLatinDigits, toPersianDigits } from "@/lib/utils/format";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  className,
}: OTPInputProps) {
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  const updateValue = (nextDigits: string[]) => {
    onChange(nextDigits.join("").replace(/\s/g, "").slice(0, length));
  };

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleChange = (index: number, char: string) => {
    const digit = toLatinDigits(char).replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit || " ";
    updateValue(next);

    if (digit && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      if (digits[index]?.trim()) {
        const next = [...digits];
        next[index] = " ";
        updateValue(next);
      } else if (index > 0) {
        focusInput(index - 1);
      }
    }

    if (event.key === "ArrowLeft" && index < length - 1) {
      focusInput(index + 1);
    }

    if (event.key === "ArrowRight" && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = toLatinDigits(event.clipboardData.getData("text"))
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pasted) return;

    const next = pasted.padEnd(length, " ").split("");
    updateValue(next);
    focusInput(Math.min(pasted.length, length - 1));
  };

  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      dir="ltr"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit.trim() ? toPersianDigits(digit.trim()) : ""}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            "size-12 rounded-xl border border-border bg-surface text-center text-lg font-semibold text-foreground shadow-sm outline-none transition-all",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            disabled && "opacity-50",
          )}
          aria-label={`رقم ${index + 1}`}
        />
      ))}
    </div>
  );
}
