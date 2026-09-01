import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@floos/ui/components/collapsible";
import { Icons } from "@floos/ui/components/icons";
import { cn } from "@floos/ui/lib/utils";

import type { FloosUIMessage } from "../types";

const TOOL_LABELS: Record<string, string> = {
  accounts_list: "Looking up accounts",
  transactions_list: "Looking up transactions",
  transaction_get: "Looking up a transaction",
  categories_list: "Checking categories",
  spending_by_category: "Analyzing spending",
  spending_over_time: "Analyzing spending over time",
  cash_summary: "Checking cash summary",
};

type ToolPart = {
  type: string;
  toolCallId: string;
  state: string;
};

function isToolPart(
  part: FloosUIMessage["parts"][number],
): part is ToolPart & FloosUIMessage["parts"][number] {
  return (
    typeof part.type === "string" &&
    part.type.startsWith("tool-") &&
    "state" in part &&
    "toolCallId" in part
  );
}

function labelForTool(type: string) {
  const name = type.startsWith("tool-") ? type.slice("tool-".length) : type;
  return TOOL_LABELS[name] ?? "Looking up data";
}

function isComplete(state: string) {
  return state === "output-available" || state === "output-error";
}

const chipClassName =
  "inline-flex w-fit max-w-full items-center gap-1.5 border border-border bg-background px-2 py-1 text-[11px] leading-none text-muted-foreground";

function ToolChip({ label, done }: { label: string; done: boolean }) {
  return (
    <span className={cn(chipClassName, !done && "shimmer")}>
      {done ? <Icons.check className="size-3 shrink-0" /> : <Icons.loader className="size-3 shrink-0 animate-spin" />}
      {label}
    </span>
  );
}

function CompletedToolGroup({ tools }: { tools: ToolPart[] }) {
  const [open, setOpen] = useState(false);

  const first = tools[0];
  if (tools.length === 1 && first) {
    return <ToolChip label={labelForTool(first.type)} done />;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-fit">
      <div className={cn(chipClassName, "flex-col items-stretch gap-0 overflow-hidden p-0")}>
        <CollapsibleTrigger className="inline-flex cursor-pointer items-center gap-1.5 px-2 py-1 text-[11px] leading-none text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
          {open ? (
            <Icons.chevronRight className="size-3 shrink-0 rotate-90" />
          ) : (
            <Icons.check className="size-3 shrink-0" />
          )}
          Used {tools.length} tools
        </CollapsibleTrigger>
        <CollapsibleContent>
          {tools.map((tool) => (
            <div
              key={tool.toolCallId}
              className="flex items-center gap-1.5 border-t border-border px-2 py-1 text-[11px] leading-none text-muted-foreground"
            >
              <Icons.check className="size-3 shrink-0" />
              {labelForTool(tool.type)}
            </div>
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ToolProgress({ parts }: { parts: FloosUIMessage["parts"] }) {
  const tools = parts.filter(isToolPart);
  if (tools.length === 0) return null;

  const allDone = tools.every((tool) => isComplete(tool.state));

  return (
    <div className="flex w-fit max-w-full flex-col items-start gap-1.5">
      {allDone ? (
        <CompletedToolGroup tools={tools} />
      ) : (
        tools.map((tool) => (
          <ToolChip
            key={tool.toolCallId}
            label={labelForTool(tool.type)}
            done={isComplete(tool.state)}
          />
        ))
      )}
    </div>
  );
}

export function ThinkingIndicator() {
  return <p className="shimmer text-sm text-muted-foreground">Thinking…</p>;
}
