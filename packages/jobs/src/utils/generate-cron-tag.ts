/**
 * Deterministic daily cron from a space id so syncs are spread across the day.
 * generateCronTag(spaceId) → "minute hour * * *"
 */
export function generateCronTag(spaceId: string): string {
  const hash = Array.from(spaceId).reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const minute = hash % 60;
  const hour = hash % 24;

  return `${minute} ${hour} * * *`;
}
