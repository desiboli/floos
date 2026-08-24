import { Icons } from "@floos/ui/components/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@floos/ui/components/tooltip";

export function SystemBadge() {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex text-muted-foreground"
        aria-label="System category"
      >
        <Icons.shieldLock className="size-4" />
      </TooltipTrigger>
      <TooltipContent>System category</TooltipContent>
    </Tooltip>
  );
}
