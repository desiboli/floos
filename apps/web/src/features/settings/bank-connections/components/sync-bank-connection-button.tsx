import { Button } from "@floos/ui/components/button";
import { Icons } from "@floos/ui/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@floos/ui/components/tooltip";
import { useEffect, useState } from "react";

import { useSyncBankConnection } from "@/features/banking/hooks/use-sync-bank-connection";
import {
  isManualSyncCoolingDown,
  MANUAL_SYNC_COOLDOWN_MS,
} from "@/features/banking/lib/manual-sync";

export function SyncBankConnectionButton({
  connectionId,
  lastSyncAt,
}: {
  connectionId: string;
  lastSyncAt: string | null;
}) {
  const sync = useSyncBankConnection();
  const [queuedAt, setQueuedAt] = useState<number | null>(null);
  const [, setCooldownTick] = useState(0);
  const coolingDown = isManualSyncCoolingDown(lastSyncAt, queuedAt);
  const disabled = sync.isPending || coolingDown;

  useEffect(() => {
    if (!coolingDown) return;
    const lastSyncMs = lastSyncAt ? new Date(lastSyncAt).getTime() : 0;
    const latest = Math.max(lastSyncMs, queuedAt ?? 0);
    const remaining = MANUAL_SYNC_COOLDOWN_MS - (Date.now() - latest);
    if (remaining <= 0) return;
    const timeout = window.setTimeout(() => {
      setQueuedAt(null);
      setCooldownTick((tick) => tick + 1);
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [coolingDown, lastSyncAt, queuedAt]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" />}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Fetch latest transactions"
            disabled={disabled}
            onClick={() => {
              sync.mutate(connectionId, {
                onSuccess: () => setQueuedAt(Date.now()),
              });
            }}
          >
            {sync.isPending ? <Icons.loader className="animate-spin" /> : <Icons.refresh />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {coolingDown ? "Already synced recently" : "Fetch latest transactions"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
