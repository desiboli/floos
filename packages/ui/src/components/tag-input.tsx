import { IconX } from "@tabler/icons-react";
import { useState, type KeyboardEvent } from "react";

import { cn } from "@floos/ui/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_MAX = 10;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isEmail(value: string) {
  return EMAIL_RE.test(value);
}

export function TagInput({
  value,
  onChange,
  max = DEFAULT_MAX,
  placeholder,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  removeLabel = "Remove",
}: {
  value: string[];
  onChange: (emails: string[]) => void;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  removeLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const atLimit = value.length >= max;
  const normalizedDraft = normalizeEmail(draft);
  const draftInvalid = normalizedDraft.length > 0 && !isEmail(normalizedDraft);

  function tryAdd(raw: string) {
    const email = normalizeEmail(raw);
    if (!email) return true;
    if (atLimit) return false;
    if (!isEmail(email)) return false;
    if (value.includes(email)) {
      setDraft("");
      return true;
    }
    onChange([...value, email]);
    setDraft("");
    return true;
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      tryAdd(draft);
      return;
    }
    if (event.key === "Backspace" && draft.length === 0 && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 border border-input bg-transparent px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50",
        disabled && "pointer-events-none opacity-50",
        (ariaInvalid || draftInvalid) && "border-destructive ring-1 ring-destructive/20",
      )}
    >
      {value.map((email) => (
        <span
          key={email}
          className="inline-flex items-center gap-1 border border-border bg-muted px-1.5 py-0.5 text-xs"
        >
          {email}
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label={`${removeLabel} ${email}`}
            disabled={disabled}
            onClick={() => onChange(value.filter((item) => item !== email))}
          >
            <IconX className="size-3" />
          </button>
        </span>
      ))}
      {atLimit ? null : (
        <input
          id={id}
          type="email"
          value={draft}
          disabled={disabled}
          placeholder={value.length === 0 ? placeholder : undefined}
          aria-invalid={ariaInvalid || draftInvalid}
          autoComplete="off"
          className="min-w-32 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            tryAdd(draft);
          }}
        />
      )}
    </div>
  );
}
