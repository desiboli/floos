import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@floos/ui/components/dropdown-menu";
import { Icons } from "@floos/ui/components/icons";
import { InputGroupButton } from "@floos/ui/components/input-group";

const promptToolClassName =
  "h-6 min-w-6 px-0 font-normal tracking-normal normal-case text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground";

export function SuggestionsMenu({
  suggestions,
  open,
  onOpenChange,
  onSelect,
  disabled,
}: {
  suggestions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <InputGroupButton
            type="button"
            size="icon-xs"
            className={promptToolClassName}
            aria-label="Suggestions"
            disabled={disabled}
          />
        }
      >
        <Icons.bolt />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-72 max-w-sm">
        {suggestions.map((suggestion) => (
          <DropdownMenuItem
            key={suggestion}
            className="normal-case tracking-normal"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
