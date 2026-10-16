"use client";

import { useId, useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toLatinDigits } from "@/lib/utils/format";

export interface SearchableSelectOption {
  label: string;
  value: string;
  keywords?: string;
  disabled?: boolean;
  hint?: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  noResultsText?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  "aria-invalid"?: boolean;
}

function normalizeSearchText(value: string): string {
  return toLatinDigits(value)
    .trim()
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک");
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "انتخاب کنید",
  searchPlaceholder = "جستجو...",
  emptyText = "موردی برای انتخاب نیست",
  noResultsText = "نتیجه‌ای پیدا نشد",
  disabled = false,
  className,
  triggerClassName,
  "aria-invalid": ariaInvalid,
}: SearchableSelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const haystack = normalizeSearchText(
        `${option.label} ${option.keywords ?? ""}`,
      );
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (disabled) return;
        setOpen(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-expanded={open}
          aria-controls={listId}
          role="combobox"
          className={cn(
            "h-12 w-full justify-between rounded-xl border-border/80 bg-surface px-3.5 font-normal shadow-sm hover:bg-surface",
            !selected && "text-muted-foreground/80",
            "disabled:bg-muted/40",
            triggerClassName,
          )}
        >
          <span className="truncate text-right">
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        dir="rtl"
        className={cn(
          "w-[var(--radix-popover-trigger-width)] rounded-xl border-border/80 p-2 shadow-lg",
          className,
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const input = (event.currentTarget as HTMLElement).querySelector(
            "input",
          );
          input?.focus();
        }}
      >
        <div className="relative mb-2">
          <Search
            className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 rounded-lg border-border/80 bg-surface pr-8 text-sm"
            aria-label={searchPlaceholder}
          />
        </div>

        <div
          id={listId}
          role="listbox"
          className="max-h-56 overflow-y-auto overscroll-contain"
        >
          {options.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              {emptyText}
            </p>
          ) : filteredOptions.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              {noResultsText}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filteredOptions.map((option) => {
                const isSelected = option.value === value;
                const isOptionDisabled = Boolean(option.disabled);
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={isOptionDisabled}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2.5 text-right text-sm transition-colors",
                        isOptionDisabled &&
                          "cursor-not-allowed opacity-50 hover:bg-transparent",
                        !isOptionDisabled &&
                          (isSelected
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-foreground hover:bg-muted/70"),
                      )}
                      onClick={() => {
                        if (isOptionDisabled) return;
                        onValueChange(option.value);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{option.label}</span>
                        {option.hint ? (
                          <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                            {option.hint}
                          </span>
                        ) : null}
                      </span>
                      {isSelected && !isOptionDisabled ? (
                        <Check
                          className="size-4 shrink-0"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
