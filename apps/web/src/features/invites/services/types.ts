import type { InferRequestType, InferResponseType } from "hono/client";

import { api } from "@/lib/api-client";

export type CreateInvitesInput = InferRequestType<typeof api.spaces.invites.$post>["json"];
export type CreateInvitesResult = InferResponseType<typeof api.spaces.invites.$post, 200>;
export type SkippedInvite = CreateInvitesResult["skippedInvites"][number];

export type PendingInvitesResult = InferResponseType<typeof api.spaces.invites.$get, 200>;
export type PendingInvite = PendingInvitesResult["invites"][number];

export type InvitePreviewResult = InferResponseType<(typeof api.invites)[":token"]["$get"], 200>;

export type AcceptInviteResult = InferResponseType<
  (typeof api.invites)[":token"]["accept"]["$post"],
  200
>;

export type InviteActionCode =
  | "not_found"
  | "email_mismatch"
  | "expired"
  | "revoked"
  | "declined"
  | "accepted";

export class InviteActionError extends Error {
  readonly code: InviteActionCode;
  readonly status: number;

  constructor(message: string, code: InviteActionCode, status: number) {
    super(message);
    this.name = "InviteActionError";
    this.code = code;
    this.status = status;
  }
}

function isInviteActionCode(value: string): value is InviteActionCode {
  return (
    value === "not_found" ||
    value === "email_mismatch" ||
    value === "expired" ||
    value === "revoked" ||
    value === "declined" ||
    value === "accepted"
  );
}

export function inviteActionErrorFromBody(
  status: number,
  body: { error?: string; code?: string } | null,
) {
  const code = body?.code && isInviteActionCode(body.code) ? body.code : "not_found";
  return new InviteActionError(body?.error ?? "Invite action failed", code, status);
}
