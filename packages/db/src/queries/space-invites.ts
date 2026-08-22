import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, inArray } from "drizzle-orm";

import type { Database } from "..";
import type { SpaceInviteStatus } from "../schema/space-invites";

import { user } from "../schema/auth";
import { spaceInvites } from "../schema/space-invites";
import { spaceMembers, spaces } from "../schema/spaces";

export const INVITE_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;
export const MAX_EMAILS_PER_REQUEST = 10;
export const MAX_PENDING_INVITES = 50;

export type InviteSkipReason = "self" | "already_member" | "already_invited" | "duplicate";

export type SkippedInvite = { email: string; reason: InviteSkipReason };

export type CreatedInvite = {
  id: string;
  email: string;
  /** Raw token for building inviteUrl in HTTP only. Never persist or log. */
  token: string;
};

export class PendingInviteLimitError extends Error {
  constructor() {
    super("This space already has too many pending invites");
    this.name = "PendingInviteLimitError";
  }
}

export function generateInviteToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

function isExpired(expiresAt: Date, now: Date) {
  return expiresAt.getTime() < now.getTime();
}

async function markExpired(db: Database, id: string) {
  await db.update(spaceInvites).set({ status: "expired" }).where(eq(spaceInvites.id, id));
}

export async function countPendingInvites(db: Database, spaceId: string, now = new Date()) {
  const [row] = await db
    .select({ value: count() })
    .from(spaceInvites)
    .where(
      and(
        eq(spaceInvites.spaceId, spaceId),
        eq(spaceInvites.status, "pending"),
        gt(spaceInvites.expiresAt, now),
      ),
    );

  return row?.value ?? 0;
}

export async function createSpaceInvites(
  db: Database,
  {
    spaceId,
    invitedByUserId,
    invitedByEmail,
    emails,
  }: {
    spaceId: string;
    invitedByUserId: string;
    invitedByEmail: string;
    emails: string[];
  },
): Promise<{ created: CreatedInvite[]; skipped: SkippedInvite[] }> {
  const now = new Date();
  const selfEmail = normalizeInviteEmail(invitedByEmail);

  const normalized: string[] = [];
  for (const raw of emails) {
    const email = normalizeInviteEmail(raw);
    if (!email) continue;
    if (normalized.length >= MAX_EMAILS_PER_REQUEST) break;
    normalized.push(email);
  }

  if (normalized.length === 0) {
    return { created: [], skipped: [] };
  }

  const [members, pendingRows] = await Promise.all([
    db
      .select({ email: user.email })
      .from(spaceMembers)
      .innerJoin(user, eq(spaceMembers.userId, user.id))
      .where(eq(spaceMembers.spaceId, spaceId)),
    db
      .select({
        id: spaceInvites.id,
        email: spaceInvites.email,
        expiresAt: spaceInvites.expiresAt,
      })
      .from(spaceInvites)
      .where(and(eq(spaceInvites.spaceId, spaceId), eq(spaceInvites.status, "pending"))),
  ]);

  const memberEmails = new Set(members.map((m) => normalizeInviteEmail(m.email)));
  const pendingUnexpired = new Set<string>();
  const expiredPendingIds: string[] = [];

  for (const row of pendingRows) {
    if (isExpired(row.expiresAt, now)) {
      expiredPendingIds.push(row.id);
    } else {
      pendingUnexpired.add(row.email);
    }
  }

  if (expiredPendingIds.length > 0) {
    await db
      .update(spaceInvites)
      .set({ status: "expired" })
      .where(inArray(spaceInvites.id, expiredPendingIds));
  }

  const seen = new Set<string>();
  const skipped: SkippedInvite[] = [];
  const toCreate: string[] = [];

  for (const email of normalized) {
    if (seen.has(email)) {
      skipped.push({ email, reason: "duplicate" });
      continue;
    }
    seen.add(email);

    if (email === selfEmail) {
      skipped.push({ email, reason: "self" });
      continue;
    }
    if (memberEmails.has(email)) {
      skipped.push({ email, reason: "already_member" });
      continue;
    }
    if (pendingUnexpired.has(email)) {
      skipped.push({ email, reason: "already_invited" });
      continue;
    }

    toCreate.push(email);
  }

  const pendingCount = pendingUnexpired.size;
  if (pendingCount + toCreate.length > MAX_PENDING_INVITES) {
    throw new PendingInviteLimitError();
  }

  const created: CreatedInvite[] = [];
  const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_MS);

  for (const email of toCreate) {
    const token = generateInviteToken();
    const tokenHash = hashInviteToken(token);
    const [row] = await db
      .insert(spaceInvites)
      .values({
        spaceId,
        email,
        role: "member",
        invitedBy: invitedByUserId,
        tokenHash,
        status: "pending",
        expiresAt,
      })
      .returning({ id: spaceInvites.id });

    if (row) {
      created.push({ id: row.id, email, token });
    }
  }

  return { created, skipped };
}

export async function listPendingInvites(db: Database, spaceId: string) {
  const now = new Date();
  const rows = await db
    .select({
      id: spaceInvites.id,
      email: spaceInvites.email,
      status: spaceInvites.status,
      expiresAt: spaceInvites.expiresAt,
    })
    .from(spaceInvites)
    .where(and(eq(spaceInvites.spaceId, spaceId), eq(spaceInvites.status, "pending")));

  const expiredIds = rows.filter((row) => isExpired(row.expiresAt, now)).map((row) => row.id);
  if (expiredIds.length > 0) {
    await db
      .update(spaceInvites)
      .set({ status: "expired" })
      .where(inArray(spaceInvites.id, expiredIds));
  }

  return rows.filter((row) => !isExpired(row.expiresAt, now));
}

export type InvitePreview = {
  id: string;
  spaceId: string;
  email: string;
  status: SpaceInviteStatus;
  expiresAt: Date;
  spaceName: string;
  invitedByName: string;
};

export async function getInviteByTokenHash(
  db: Database,
  tokenHash: string,
): Promise<InvitePreview | null> {
  const [row] = await db
    .select({
      id: spaceInvites.id,
      spaceId: spaceInvites.spaceId,
      email: spaceInvites.email,
      status: spaceInvites.status,
      expiresAt: spaceInvites.expiresAt,
      spaceName: spaces.name,
      invitedByName: user.name,
    })
    .from(spaceInvites)
    .innerJoin(spaces, eq(spaceInvites.spaceId, spaces.id))
    .innerJoin(user, eq(spaceInvites.invitedBy, user.id))
    .where(eq(spaceInvites.tokenHash, tokenHash))
    .limit(1);

  if (!row) return null;

  if (row.status === "pending" && isExpired(row.expiresAt, new Date())) {
    await markExpired(db, row.id);
    return { ...row, status: "expired" };
  }

  return row;
}

export async function getInviteById(db: Database, id: string, spaceId: string) {
  const [row] = await db
    .select({
      id: spaceInvites.id,
      status: spaceInvites.status,
      spaceId: spaceInvites.spaceId,
    })
    .from(spaceInvites)
    .where(and(eq(spaceInvites.id, id), eq(spaceInvites.spaceId, spaceId)))
    .limit(1);

  return row ?? null;
}

export type AcceptInviteResult =
  | { ok: true; spaceId: string }
  | { ok: false; code: "not_found" | "email_mismatch" | SpaceInviteStatus };

export async function acceptInvite(
  db: Database,
  {
    tokenHash,
    userId,
    userEmail,
  }: {
    tokenHash: string;
    userId: string;
    userEmail: string;
  },
): Promise<AcceptInviteResult> {
  const invite = await getInviteByTokenHash(db, tokenHash);

  if (!invite) {
    return { ok: false, code: "not_found" };
  }

  if (normalizeInviteEmail(userEmail) !== invite.email) {
    return { ok: false, code: "email_mismatch" };
  }

  if (invite.status !== "pending") {
    if (invite.status === "accepted") {
      const role = await db
        .select({ id: spaceMembers.id })
        .from(spaceMembers)
        .where(and(eq(spaceMembers.spaceId, invite.spaceId), eq(spaceMembers.userId, userId)))
        .limit(1);

      if (role[0]) {
        await db.update(user).set({ activeSpaceId: invite.spaceId }).where(eq(user.id, userId));
        return { ok: true, spaceId: invite.spaceId };
      }
    }
    return { ok: false, code: invite.status };
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(spaceMembers)
      .values({
        spaceId: invite.spaceId,
        userId,
        role: "member",
      })
      .onConflictDoNothing({
        target: [spaceMembers.spaceId, spaceMembers.userId],
      });

    await tx
      .update(spaceInvites)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(eq(spaceInvites.id, invite.id));

    await tx.update(user).set({ activeSpaceId: invite.spaceId }).where(eq(user.id, userId));
  });

  return { ok: true, spaceId: invite.spaceId };
}

export type DeclineInviteResult =
  | { ok: true }
  | { ok: false; code: "not_found" | "email_mismatch" | SpaceInviteStatus };

export async function declineInvite(
  db: Database,
  {
    tokenHash,
    userEmail,
  }: {
    tokenHash: string;
    userEmail: string;
  },
): Promise<DeclineInviteResult> {
  const invite = await getInviteByTokenHash(db, tokenHash);

  if (!invite) {
    return { ok: false, code: "not_found" };
  }

  if (normalizeInviteEmail(userEmail) !== invite.email) {
    return { ok: false, code: "email_mismatch" };
  }

  if (invite.status !== "pending") {
    if (invite.status === "declined") {
      return { ok: true };
    }
    return { ok: false, code: invite.status };
  }

  await db.update(spaceInvites).set({ status: "declined" }).where(eq(spaceInvites.id, invite.id));

  return { ok: true };
}

export async function revokeInvite(db: Database, id: string, spaceId: string) {
  const invite = await getInviteById(db, id, spaceId);
  if (!invite) return { ok: false as const, code: "not_found" as const };

  if (invite.status !== "pending") {
    return { ok: false as const, code: invite.status };
  }

  await db
    .update(spaceInvites)
    .set({ status: "revoked" })
    .where(and(eq(spaceInvites.id, id), eq(spaceInvites.spaceId, spaceId)));

  return { ok: true as const };
}
