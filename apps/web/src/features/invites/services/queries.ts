import { queryOptions } from "@tanstack/react-query";

import { getInvitePreview, listPendingInvites } from "./api";

export const pendingInvitesQueryOptions = () =>
  queryOptions({
    queryKey: ["spaces", "invites"],
    queryFn: listPendingInvites,
  });

export const invitePreviewQueryOptions = (token: string) =>
  queryOptions({
    queryKey: ["invites", "preview", token],
    queryFn: () => getInvitePreview(token),
    enabled: token.length > 0,
    retry: false,
  });
