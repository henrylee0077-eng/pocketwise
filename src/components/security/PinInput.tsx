"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onComplete?: (value: string) => void;
  "aria-label"?: string;
}

/**
 * A 6-digit PIN entry control: one real (invisible) numeric input for
 * capture — so mobile shows the numeric keypad and paste/autofill still
 * work — overlaid on a row of visual boxes reflecting the current value.
 */
export function PinInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  disabled = false,
  invalid = false,
  onComplete,
  "aria-label": ariaLabel,
}: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length) onComplete?.(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per completed value, not on onComplete identity changes
  }, [value, length]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, length);
    onChange(digits);
  }

  return (
    <div className="relative inline-flex" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={ariaLabel}
        className="absolute inset-0 z-10 h-full w-full cursor-default opacity-0 disabled:cursor-not-allowed"
      />
      <div className="flex gap-2" aria-hidden="true">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const isActive = focused && i === value.length;
          return (
            <div
              key={i}
              className={cn(
                "flex size-11 items-center justify-center rounded-xl border-2 text-lg font-semibold transition-colors",
                invalid
                  ? "border-destructive text-destructive"
                  : isActive
                    ? "border-primary text-foreground"
                    : "border-border text-foreground",
                filled && !invalid && "bg-secondary/60",
              )}
            >
              {filled ? "•" : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
