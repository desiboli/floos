import { Avatar, AvatarFallback } from "@floos/ui/components/avatar";
import { Button } from "@floos/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@floos/ui/components/dialog";
import { Icons } from "@floos/ui/components/icons";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@floos/ui/components/item";
import { toast } from "@floos/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { Space } from "../services/types";

import { useUserSpaces } from "../hooks/use-user-spaces";
import { setActiveSpace } from "../services/api";

function SpaceRow({
  space,
  disabled,
  isLaunching,
  onLaunch,
}: {
  space: Space;
  disabled: boolean;
  isLaunching: boolean;
  onLaunch: (spaceId: string) => void;
}) {
  const initial = space.name.charAt(0).toUpperCase();

  return (
    <Item variant="muted">
      <ItemMedia>
        <Avatar size="sm">
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{space.name}</ItemTitle>
        <ItemDescription>
          {space.country} · {space.currency}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          aria-label={isLaunching ? "Launching" : "Launch"}
          onClick={() => onLaunch(space.id)}
        >
          {isLaunching ? <Icons.loader className="size-4 animate-spin" /> : "Launch"}
        </Button>
      </ItemActions>
    </Item>
  );
}

export function SelectSpaceDialog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { spaces, activeSpaceId, activeSpace, isPending } = useUserSpaces();
  const switchSpace = useMutation({
    mutationFn: setActiveSpace,
  });

  if (isPending || spaces.length === 0) {
    return null;
  }

  const label = activeSpace?.name ?? "Select space";

  const handleLaunch = async (spaceId: string) => {
    try {
      if (spaceId !== activeSpaceId) {
        await switchSpace.mutateAsync({ spaceId });
        await queryClient.invalidateQueries({ queryKey: ["spaces"] });
      }
      await navigate({ to: "/" });
    } catch (error) {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to switch space",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>{label}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select space</DialogTitle>
          <DialogDescription>
            Launch a space you already have. Stay on this page to create a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-65 flex-col gap-2 overflow-y-auto">
          {spaces.map((space) => (
            <SpaceRow
              key={space.id}
              space={space}
              disabled={switchSpace.isPending}
              isLaunching={switchSpace.isPending && switchSpace.variables?.spaceId === space.id}
              onLaunch={handleLaunch}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
