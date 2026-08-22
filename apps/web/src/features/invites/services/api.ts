import { api } from "@/lib/api-client";

import {
  inviteActionErrorFromBody,
  type AcceptInviteResult,
  type CreateInvitesInput,
  type CreateInvitesResult,
  type InvitePreviewResult,
  type PendingInvitesResult,
} from "./types";

export async function createInvites(input: CreateInvitesInput): Promise<CreateInvitesResult> {
  const res = await api.spaces.invites.$post({ json: input });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to send invites");
  }
  return res.json();
}

export async function listPendingInvites(): Promise<PendingInvitesResult> {
  const res = await api.spaces.invites.$get();
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to list invites");
  }
  return res.json();
}

export async function revokeInvite(id: string): Promise<{ id: string }> {
  const res = await api.spaces.invites[":id"].$delete({ param: { id } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to revoke invite");
  }
  return res.json();
}

export async function getInvitePreview(token: string): Promise<InvitePreviewResult> {
  const res = await api.invites[":token"].$get({ param: { token } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
    throw inviteActionErrorFromBody(res.status, body);
  }
  return res.json();
}

export async function acceptInvite(token: string): Promise<AcceptInviteResult> {
  const res = await api.invites[":token"].accept.$post({ param: { token } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
    throw inviteActionErrorFromBody(res.status, body);
  }
  return res.json();
}

export async function declineInvite(token: string): Promise<{ declined: true }> {
  const res = await api.invites[":token"].decline.$post({ param: { token } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
    throw inviteActionErrorFromBody(res.status, body);
  }
  return res.json();
}
