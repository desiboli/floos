/** Keep in sync with the server cooldown on POST /banking/connections/{id}/sync. */
export const MANUAL_SYNC_COOLDOWN_MS = 15 * 60 * 1000;

export function isManualSyncCoolingDown(lastSyncAt: string | null, queuedAt: number | null) {
  const lastSyncMs = lastSyncAt ? new Date(lastSyncAt).getTime() : 0;
  const latest = Math.max(lastSyncMs, queuedAt ?? 0);
  if (!latest) return false;
  return Date.now() - latest < MANUAL_SYNC_COOLDOWN_MS;
}
