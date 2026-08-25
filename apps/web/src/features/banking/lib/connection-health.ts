const WARNING_DAYS = 14;

export type ConnectionHealth =
  | { kind: "disconnected" }
  | { kind: "expired" }
  | { kind: "expires-soon"; days: number }
  | { kind: "ok" };

export function connectionHealth(connection: {
  status: string;
  expiresAt: string | null;
}): ConnectionHealth {
  if (connection.status === "disconnected") return { kind: "disconnected" };
  if (!connection.expiresAt) return { kind: "ok" };

  const days = Math.ceil((new Date(connection.expiresAt).getTime() - Date.now()) / 86_400_000);

  if (days <= 0) return { kind: "expired" };
  if (days <= WARNING_DAYS) return { kind: "expires-soon", days };
  return { kind: "ok" };
}
